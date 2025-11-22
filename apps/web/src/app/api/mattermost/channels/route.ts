import { NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  mmUserFetch
} from "@/server/mattermost";

interface MattermostChannel {
  id: string;
  name: string;
  display_name: string;
  type: string;
  is_favorite?: boolean;
  total_msg_count?: number;
  mention_count?: number;
  message_count?: number;
  directUser?: MattermostUser | null;
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

interface MattermostChannelMemberCounts extends MattermostChannelMember {
  channel_id: string;
  mention_count: number;
  msg_count: number;
}

export async function GET() {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const teamId = getMattermostTeamId();

    const [channels, currentUser, channelMembers, favoriteChannels] = await Promise.all([
      mmUserFetch<MattermostChannel[]>(`/users/me/channels?page=0&per_page=200`, token),
      mmUserFetch<MattermostUser>(`/users/me`, token),
      mmUserFetch<MattermostChannelMemberCounts[]>(`/users/me/teams/${teamId}/channels/members`, token),
      mmUserFetch<MattermostChannel[]>(`/users/me/teams/${teamId}/channels/favorites`, token).catch(() => [])
    ]);

    const favoriteIds = new Set((favoriteChannels || []).map((channel) => channel.id));

    const mentionCounts = channelMembers.reduce<Record<string, MattermostChannelMemberCounts>>((acc, member) => {
      acc[member.channel_id] = member;
      return acc;
    }, {});

    const unreadMessagesById = channels.reduce<Record<string, number>>((acc, channel) => {
      const member = mentionCounts[channel.id];
      acc[channel.id] = Math.max((channel.total_msg_count || 0) - (member?.msg_count || 0), 0);
      return acc;
    }, {});

    const directChannels = channels.filter((channel) => channel.type === "D");

    let directChannelMembers: Record<string, string[]> = {};
    let usersById: Record<string, MattermostUser> = {};
    let directMemberCounts: Record<string, MattermostChannelMemberCounts> = {};

    if (directChannels.length) {
      const [memberLists, memberCounts] = await Promise.all([
        Promise.all(
          directChannels.map((channel) =>
            mmUserFetch<MattermostChannelMember[]>(`/channels/${channel.id}/members`, token)
          )
        ),
        Promise.all(
          directChannels.map((channel) =>
            mmUserFetch<MattermostChannelMemberCounts>(`/channels/${channel.id}/members/me`, token)
          )
        )
      ]);

      directChannelMembers = memberLists.reduce<Record<string, string[]>>((acc, members, index) => {
        acc[directChannels[index].id] = members.map((member) => member.user_id);
        return acc;
      }, {});

      directMemberCounts = memberCounts.reduce<Record<string, MattermostChannelMemberCounts>>((acc, member, index) => {
        acc[directChannels[index].id] = member;
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
      const directMember = directMemberCounts[channel.id];

      return {
        ...channel,
        mention_count: directMember?.mention_count || mentionCounts[channel.id]?.mention_count || 0,
        message_count: Math.max((channel.total_msg_count || 0) - (directMember?.msg_count || 0), 0),
        display_name: directUser ? `@${directUser.username}` : channel.display_name,
        directUser: directUser || null
      };
    });

    const channelsWithCounts = channelsWithDirectUsers.map((channel) => ({
      ...channel,
      is_favorite: favoriteIds.has(channel.id),
      mention_count:
        directMemberCounts[channel.id]?.mention_count ||
        mentionCounts[channel.id]?.mention_count ||
        channel.mention_count ||
        0,
      message_count:
        channel.type === "D"
          ? Math.max((channel.total_msg_count || 0) - (directMemberCounts[channel.id]?.msg_count || 0), 0)
          : channel.message_count || 0
    }));

    return NextResponse.json({ channels: channelsWithCounts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
