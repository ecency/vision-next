import { NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

interface MattermostChannel {
  id: string;
  type: string;
  total_msg_count?: number;
}

interface MattermostChannelMember {
  channel_id: string;
  mention_count: number;
  msg_count: number;
}

const PAGE_SIZE = 200;
const DEFAULT_MAX_PAGES = 5; // Safety cap to avoid long-running unread checks

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

export async function GET() {
  const token = await getMattermostTokenFromCookies();

  if (!token) {
    return NextResponse.json({
      channels: [],
      totalMentions: 0,
      totalDMs: 0,
      totalUnread: 0
    });
  }

  try {
    const teamId = getMattermostTeamId();

    const maxPages = Math.max(
      1,
      Number(process.env.MATTERMOST_UNREAD_MAX_PAGES ?? DEFAULT_MAX_PAGES)
    );

    const [channelsResult, membersResult, currentUser] = await Promise.all([
      fetchAllPages<MattermostChannel>("/users/me/channels", token, maxPages),
      fetchAllPages<MattermostChannelMember>(
        `/users/me/teams/${teamId}/channels/members`,
        token,
        maxPages
      ),
      mmUserFetch<{ id: string }>(`/users/me`, token)
    ]);

    const allChannels = channelsResult.items;
    const members = membersResult.items;
    const truncated = channelsResult.truncated || membersResult.truncated;

    const memberByChannelId = members.reduce<Record<string, MattermostChannelMember>>((acc, member) => {
      acc[member.channel_id] = member;
      return acc;
    }, {});

    // NOTE: Avoid per-DM N+1 fetches to prevent timeouts.
    // Rely on bulk membership data; for any missing entries, counts default to 0.

    const channelsWithCounts = allChannels.map((channel) => {
      const member = memberByChannelId[channel.id];
      const unreadMessages = Math.max((channel.total_msg_count || 0) - (member?.msg_count || 0), 0);
      return {
        channelId: channel.id,
        type: channel.type,
        mention_count: member?.mention_count || 0,
        message_count: unreadMessages
      };
    });

    const totalMentions = channelsWithCounts
      .filter((channel) => channel.type !== "D")
      .reduce((sum, channel) => sum + channel.mention_count, 0);

    const totalDMs = channelsWithCounts
      .filter((channel) => channel.type === "D")
      .reduce((sum, channel) => sum + channel.message_count, 0);

    return NextResponse.json({
      channels: channelsWithCounts,
      totalMentions,
      totalDMs,
      totalUnread: totalMentions + totalDMs,
      truncated
    });
  } catch (error) {
    return handleMattermostError(error);
  }
}
