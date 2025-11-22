import { NextResponse } from "next/server";
import { getMattermostTokenFromCookies, mmUserFetch } from "@/server/mattermost";

export async function POST(_req: Request, { params }: { params: { channelId: string } }) {
  const token = getMattermostTokenFromCookies();

  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const channelId = params.channelId;
    await mmUserFetch(`/channels/${channelId}/view`, token, {
      method: "POST",
      body: JSON.stringify({ channel_id: channelId })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
