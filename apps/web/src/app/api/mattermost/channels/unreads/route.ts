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

    const [allChannels, members, currentUser] = await Promise.all([
      mmUserFetch<MattermostChannel[]>(`/users/me/channels?page=0&per_page=200`, token),
      mmUserFetch<MattermostChannelMember[]>(`/users/me/teams/${teamId}/channels/members`, token),
      mmUserFetch<{ id: string }>(`/users/me`, token)
    ]);


    const memberByChannelId = members.reduce<Record<string, MattermostChannelMember>>((acc, member) => {
      acc[member.channel_id] = member;
      return acc;
    }, {});

    // NOTE: N+1 pattern - Mattermost API limitation
    // For N DM channels, makes N requests for member counts
    // Already parallelized, but could be optimized if Mattermost adds bulk endpoint
    const directMemberCounts = await Promise.all(
      allChannels
        .filter((channel) => channel.type === "D")
        .map((channel) => mmUserFetch<MattermostChannelMember>(`/channels/${channel.id}/members/me`, token))
    );

    directMemberCounts.forEach((member) => {
      memberByChannelId[member.channel_id] = member;
    });

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
      totalUnread: totalMentions + totalDMs
    });
  } catch (error) {
    return handleMattermostError(error);
  }
}
