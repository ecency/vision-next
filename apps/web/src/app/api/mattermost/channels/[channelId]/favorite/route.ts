import { NextRequest, NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { favorite = true } = (await req.json().catch(() => ({}))) as { favorite?: boolean };

  try {
    const teamId = getMattermostTeamId();
    const path = `/users/me/teams/${teamId}/channels/${params.channelId}/favorite`;

    await mmUserFetch(path, token, { method: favorite ? "POST" : "DELETE" });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
