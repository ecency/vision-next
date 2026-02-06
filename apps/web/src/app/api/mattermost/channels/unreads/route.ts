import { NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";
import * as Sentry from "@sentry/nextjs";

interface MattermostChannel {
  id: string;
  type: string;
  name?: string;
  total_msg_count?: number;
}

interface MattermostUser {
  id: string;
  username: string;
  delete_at?: number;
}

interface MattermostChannelMember {
  channel_id: string;
  mention_count: number;
  msg_count: number;
}

interface MattermostThread {
  channel_id: string;
  unread_replies?: number;
  unread_mentions?: number;
}

interface MattermostThreadsResponse {
  threads: MattermostThread[];
  total: number;
}

const PAGE_SIZE = 200;
const DEFAULT_MAX_PAGES = 2; // Safety cap to avoid long-running unread checks
const MAX_ALLOWED_PAGES = 2;

function withPagination(path: string, page: number) {
  const [base, query] = path.split("?");
  const params = new URLSearchParams(query ?? "");
  params.set("page", String(page));
  params.set("per_page", String(PAGE_SIZE));
  return `${base}?${params.toString()}`;
}

async function fetchAllPages<T>(path: string, token: string, maxPages: number) {
  const results: T[] = [];
  let truncated = false;

  for (let page = 0; page < maxPages; page += 1) {
    const pageItems = await mmUserFetch<T[]>(withPagination(path, page), token);
    if (!pageItems.length) {
      break;
    }
    results.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) {
      break;
    }
    if (page === maxPages - 1) {
      truncated = true;
    }
  }

  return { items: results, truncated };
}

async function fetchAllThreadPages(token: string, teamId: string, maxPages: number) {
  const results: MattermostThread[] = [];
  let truncated = false;

  for (let page = 0; page < maxPages; page += 1) {
    const response = await mmUserFetch<MattermostThreadsResponse>(
      withPagination(`/users/me/teams/${teamId}/threads`, page),
      token
    );
    const pageItems = response.threads || [];
    if (!pageItems.length) {
      break;
    }
    results.push(...pageItems);
    if (pageItems.length < PAGE_SIZE) {
      break;
    }
    if (page === maxPages - 1) {
      truncated = true;
    }
  }

  return { items: results, truncated };
}

export async function GET() {
  const token = await getMattermostTokenFromCookies();

  if (!token) {
    return NextResponse.json({
      channels: [],
      totalMentions: 0,
      totalDMs: 0,
      totalThreads: 0,
      totalUnread: 0
    });
  }

  try {
    const teamId = getMattermostTeamId();

    const rawMaxPages = process.env.MATTERMOST_UNREAD_MAX_PAGES;
    const parsedMaxPages = Number.isNaN(parseInt(rawMaxPages ?? "", 10))
      ? DEFAULT_MAX_PAGES
      : parseInt(rawMaxPages as string, 10);
    const maxPages = Math.min(
      MAX_ALLOWED_PAGES,
      Math.max(1, parsedMaxPages)
    );

    const [channelsResult, membersResult, threadsResult, currentUser] = await Promise.all([
      fetchAllPages<MattermostChannel>("/users/me/channels", token, maxPages),
      fetchAllPages<MattermostChannelMember>(
        `/users/me/teams/${teamId}/channels/members`,
        token,
        maxPages
      ),
      fetchAllThreadPages(token, teamId, maxPages).catch(() => ({ items: [], truncated: false })),
      mmUserFetch<{ id: string }>(`/users/me`, token)
    ]);

    const allChannels = channelsResult.items;
    const members = membersResult.items;
    const threads = threadsResult.items;
    const truncated = channelsResult.truncated || membersResult.truncated || threadsResult.truncated;

    // Extract user IDs from DM channels to check for deactivated users
    const dmChannels = allChannels.filter((ch) => ch.type === "D");
    const dmUserIds = new Set<string>();
    dmChannels.forEach((channel) => {
      const parts = channel.name?.split("__") ?? [];
      if (parts.length === 2) {
        const otherUserId = parts.find((id) => id !== currentUser.id) || parts[0];
        if (otherUserId) {
          dmUserIds.add(otherUserId);
        }
      }
    });

    // Fetch user data to check delete_at status
    const usersById: Record<string, MattermostUser> = {};
    if (dmUserIds.size > 0) {
      try {
        const users = await mmUserFetch<MattermostUser[]>(`/users/ids`, token, {
          method: "POST",
          body: JSON.stringify(Array.from(dmUserIds))
        });
        users.forEach((user) => {
          usersById[user.id] = user;
        });
      } catch {
        // If we can't fetch users, proceed without filtering
      }
    }

    // Set of DM channel IDs to exclude (deactivated users)
    const excludedDmChannelIds = new Set<string>();
    dmChannels.forEach((channel) => {
      const parts = channel.name?.split("__") ?? [];
      if (parts.length === 2) {
        const otherUserId = parts.find((id) => id !== currentUser.id) || parts[0];
        if (otherUserId) {
          const user = usersById[otherUserId];
          // Exclude if user is deactivated (delete_at > 0)
          if (user && user.delete_at && user.delete_at > 0) {
            excludedDmChannelIds.add(channel.id);
          }
        }
      }
    });

    // Filter out excluded DM channels
    const filteredChannels = allChannels.filter((ch) => !excludedDmChannelIds.has(ch.id));

    const memberByChannelId = members.reduce<Record<string, MattermostChannelMember>>((acc, member) => {
      acc[member.channel_id] = member;
      return acc;
    }, {});

    const threadUnreadByChannel = threads.reduce<Record<string, number>>((acc, thread) => {
      const unreadReplies = thread.unread_replies || 0;
      if (!unreadReplies) return acc;
      acc[thread.channel_id] = (acc[thread.channel_id] || 0) + unreadReplies;
      return acc;
    }, {});

    const channelsWithCounts = filteredChannels.map((channel) => {
      const member = memberByChannelId[channel.id];
      const unreadMessages = Math.max((channel.total_msg_count || 0) - (member?.msg_count || 0), 0);
      return {
        channelId: channel.id,
        type: channel.type,
        mention_count: member?.mention_count || 0,
        message_count: unreadMessages,
        thread_unread: threadUnreadByChannel[channel.id] || 0
      };
    });

    const totalMentions = channelsWithCounts
      .filter((channel) => channel.type !== "D")
      .reduce((sum, channel) => sum + channel.mention_count, 0);

    const totalDMs = channelsWithCounts
      .filter((channel) => channel.type === "D")
      .reduce((sum, channel) => sum + channel.message_count, 0);

    const totalThreads = channelsWithCounts
      .filter((channel) => channel.type !== "D")
      .reduce((sum, channel) => sum + channel.thread_unread, 0);

    if (truncated) {
      Sentry.withScope((scope) => {
        scope.setTag("context", "chat");
        scope.setLevel("warning");
        scope.setExtras({
          userId: currentUser?.id,
          channelCount: allChannels.length,
          memberCount: members.length,
          maxPages,
          pageSize: PAGE_SIZE
        });
        Sentry.captureMessage("Mattermost unreads truncated");
      });
    }

    return NextResponse.json({
      channels: channelsWithCounts,
      totalMentions,
      totalDMs,
      totalThreads,
      totalUnread: totalMentions + totalDMs + totalThreads,
      truncated
    });
  } catch (error) {
    return handleMattermostError(error);
  }
}
