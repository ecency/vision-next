import { NextResponse } from "next/server";
import { getMattermostTokenFromCookies, mmUserFetch } from "@/server/mattermost";

interface MattermostChannel {
  id: string;
  name: string;
  display_name: string;
  type: string;
}

interface MattermostUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  last_picture_update?: number;
}

interface MattermostChannelMember {
  user_id: string;
}

export async function GET() {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const [channels, currentUser] = await Promise.all([
      mmUserFetch<MattermostChannel[]>(`/users/me/channels?page=0&per_page=200`, token),
      mmUserFetch<MattermostUser>(`/users/me`, token)
    ]);

    const directChannels = channels.filter((channel) => channel.type === "D");

    let directChannelMembers: Record<string, string[]> = {};
    let usersById: Record<string, MattermostUser> = {};

    if (directChannels.length) {
      const memberLists = await Promise.all(
        directChannels.map((channel) =>
          mmUserFetch<MattermostChannelMember[]>(`/channels/${channel.id}/members`, token)
        )
      );

      directChannelMembers = memberLists.reduce<Record<string, string[]>>((acc, members, index) => {
        acc[directChannels[index].id] = members.map((member) => member.user_id);
        return acc;
      }, {});

      const memberIds = new Set<string>();
      Object.values(directChannelMembers).forEach((ids) => ids.forEach((id) => memberIds.add(id)));

      if (memberIds.size) {
        const users = await mmUserFetch<MattermostUser[]>(`/users/ids`, token, {
          method: "POST",
          body: JSON.stringify(Array.from(memberIds))
        });

        users.forEach((user) => {
          usersById[user.id] = user;
        });
      }
    }

    const channelsWithDirectUsers = channels.map((channel) => {
      if (channel.type !== "D") return channel;

      const memberIds = directChannelMembers[channel.id] || [];
      const otherUserId = memberIds.find((id) => id !== currentUser.id) || memberIds[0];
      const directUser = otherUserId ? usersById[otherUserId] : undefined;

      return {
        ...channel,
        display_name: directUser ? `@${directUser.username}` : channel.display_name,
        directUser: directUser || null
      };
    });

    return NextResponse.json({ channels: channelsWithDirectUsers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
