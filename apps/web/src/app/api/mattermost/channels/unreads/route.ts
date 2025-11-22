import { NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  mmUserFetch
} from "@/server/mattermost";

interface MattermostChannel {
  id: string;
  type: string;
}

interface MattermostChannelMember {
  channel_id: string;
  mention_count: number;
  msg_count: number;
}

export async function GET() {
  const token = getMattermostTokenFromCookies();

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

    const [channels, members] = await Promise.all([
      mmUserFetch<MattermostChannel[]>(`/users/me/channels?page=0&per_page=200`, token),
      mmUserFetch<MattermostChannelMember[]>(`/users/me/teams/${teamId}/channels/members`, token)
    ]);

    const memberByChannelId = members.reduce<Record<string, MattermostChannelMember>>((acc, member) => {
      acc[member.channel_id] = member;
      return acc;
    }, {});

    const channelsWithCounts = channels.map((channel) => {
      const member = memberByChannelId[channel.id];
      return {
        channelId: channel.id,
        type: channel.type,
        mention_count: member?.mention_count || 0,
        message_count: member?.msg_count || 0
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
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
