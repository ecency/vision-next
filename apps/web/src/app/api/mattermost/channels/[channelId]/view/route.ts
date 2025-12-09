import { NextResponse } from "next/server";
import {
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const token = await getMattermostTokenFromCookies();

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { channelId } = await params;
    let prevChannelId = "";

    try {
      const body = await req.json();
      prevChannelId = body?.prev_channel_id || body?.prevChannelId || "";
    } catch (_err) {
      // ignore body parsing errors and fall back to empty prev_channel_id
    }

    await mmUserFetch(`/channels/members/me/view`, token, {
      method: "POST",
      body: JSON.stringify({ channel_id: channelId, prev_channel_id: prevChannelId })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
