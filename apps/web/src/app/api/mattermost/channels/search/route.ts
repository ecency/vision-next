import { NextResponse } from "next/server";
import { getMattermostTeamId, getMattermostTokenFromCookies, mmUserFetch } from "@/server/mattermost";

interface MattermostChannelSummary {
  id: string;
  name: string;
  display_name: string;
  type: string;
}

export async function GET(req: Request) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim() || "";

  if (query.length < 2) {
    return NextResponse.json({ channels: [] });
  }

  try {
    const teamId = getMattermostTeamId();
    const channels = await mmUserFetch<MattermostChannelSummary[]>(
      `/teams/${teamId}/channels/search`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          term: query,
          team_ids: [teamId],
          not_associated_to_group: false,
          exclude_deleted_channels: true
        })
      }
    );

    const publicChannels = channels.filter((channel) => channel.type === "O");

    return NextResponse.json({ channels: publicChannels });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
