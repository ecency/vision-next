import { NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

interface MattermostChannel {
  id: string;
  name: string;
  display_name: string;
  type: string;
  is_favorite?: boolean;
  is_muted?: boolean;
  total_msg_count?: number;
  mention_count?: number;
  message_count?: number;
  directUser?: MattermostUser | null;
  order?: number;
  last_post_at?: number;
  last_viewed_at?: number;
}

interface MattermostUser {
  id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  nickname?: string;
  last_picture_update?: number;
}

interface MattermostChannelMemberCounts {
  user_id: string;
  channel_id: string;
  mention_count: number;
  msg_count: number;
  notify_props?: {
    mark_unread?: string;
  };
  last_viewed_at?: number;
  last_update_at?: number;
}

interface MattermostChannelCategory {
  id: string;
  user_id: string;
  team_id: string;
  sort_order: number;
  sorting: "" | "recent";
  type: "favorites" | "channels" | "direct_messages";
  display_name: string;
  muted: boolean;
  collapsed: boolean;
  channel_ids: string[];
}

export async function GET() {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const teamId = getMattermostTeamId();

    const [channels, currentUser, channelMembers, categoriesResponse] = await Promise.all([
      mmUserFetch<MattermostChannel[]>(`/users/me/channels?page=0&per_page=200`, token),
      mmUserFetch<MattermostUser>(`/users/me`, token),
      mmUserFetch<MattermostChannelMemberCounts[]>(`/users/me/teams/${teamId}/channels/members`, token),
      mmUserFetch<{ categories: MattermostChannelCategory[]; order: string[] }>(
        `/users/me/teams/${teamId}/channels/categories`,
        token
      ).catch(() => ({ categories: [], order: [] }))
    ]);

    const categoryOrderIds = categoriesResponse.order && categoriesResponse.order.length
      ? categoriesResponse.order
      : categoriesResponse.categories.map((category) => category.id);

    const categoriesById = new Map(
      (categoriesResponse.categories || []).map((category) => [category.id, category])
    );

    const favoriteIds = new Set(
      (categoriesResponse.categories || [])
        .find((category) => category.type === "favorites")
        ?.channel_ids || []
    );

    const channelMembersById = channelMembers.reduce<Record<string, MattermostChannelMemberCounts>>(
      (acc, member) => {
        acc[member.channel_id] = member;
        return acc;
      },
      {}
    );

    const unreadMessagesById = channels.reduce<Record<string, number>>((acc, channel) => {
      const member = channelMembersById[channel.id];
      acc[channel.id] = Math.max((channel.total_msg_count || 0) - (member?.msg_count || 0), 0);
      return acc;
    }, {});

    const directChannels = channels.filter((channel) => channel.type === "D");
    const usersById: Record<string, MattermostUser> = {};

    if (directChannels.length) {
      const memberIds = new Set<string>();

      directChannels.forEach((channel) => {
        const parts = channel.name?.split("__") ?? [];
        const otherUserId =
          parts.length === 2
            ? parts.find((id) => id !== currentUser.id) || parts[0]
            : undefined;

        if (otherUserId) {
          memberIds.add(otherUserId);
        }
      });

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

      const parts = channel.name?.split("__") ?? [];
      const otherUserId =
        parts.length === 2
          ? parts.find((id) => id !== currentUser.id) || parts[0]
          : undefined;
      const directUser = otherUserId ? usersById[otherUserId] : undefined;
      const member = channelMembersById[channel.id];

      return {
        ...channel,
        mention_count: member?.mention_count || 0,
        message_count: Math.max((channel.total_msg_count || 0) - (member?.msg_count || 0), 0),
        display_name: directUser ? `@${directUser.username}` : channel.display_name,
        directUser: directUser || null,
        last_viewed_at: member?.last_viewed_at
      };
    });

    const channelOrderFromCategories = (() => {
      const order = new Map<string, number>();
      let index = 0;

      categoryOrderIds.forEach((categoryId) => {
        const category = categoriesById.get(categoryId);
        if (!category) return;

        category.channel_ids.forEach((channelId) => {
          if (!order.has(channelId)) {
            order.set(channelId, index++);
          }
        });
      });

      channels.forEach((channel) => {
        if (!order.has(channel.id)) {
          order.set(channel.id, index++);
        }
      });

      return order;
    })();

    const channelsWithCounts = channelsWithDirectUsers.map((channel) => ({
      ...channel,
      is_favorite: favoriteIds.has(channel.id),
      is_muted:
        (channel.type === "D"
          ? directMemberCounts[channel.id]?.notify_props?.mark_unread
          : channelMembersById[channel.id]?.notify_props?.mark_unread) === "mention",
      mention_count:
        directMemberCounts[channel.id]?.mention_count ||
        channelMembersById[channel.id]?.mention_count ||
        channel.mention_count ||
        0,
      message_count:
        channel.type === "D"
          ? Math.max((channel.total_msg_count || 0) - (directMemberCounts[channel.id]?.msg_count || 0), 0)
          : channel.message_count || 0,
      order: channelOrderFromCategories.get(channel.id),
      last_viewed_at:
        channel.type === "D"
          ? directMemberCounts[channel.id]?.last_viewed_at
          : channelMembersById[channel.id]?.last_viewed_at
    }));

    const orderedChannels = [...channelsWithCounts].sort((a, b) => {
      const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.order ?? Number.MAX_SAFE_INTEGER;

      return orderA - orderB;
    });

    return NextResponse.json({ channels: orderedChannels });
  } catch (error) {
    return handleMattermostError(error);
  }
}
