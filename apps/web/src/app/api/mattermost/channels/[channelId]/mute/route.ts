import { NextRequest, NextResponse } from "next/server";
import { getMattermostTokenFromCookies, mmUserFetch } from "@/server/mattermost";

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { mute = true } = (await req.json().catch(() => ({}))) as { mute?: boolean };

  try {
    await mmUserFetch(`/users/me/channels/${params.channelId}/notify`, token, {
      method: "PUT",
      body: JSON.stringify({ mark_unread: mute ? "mention" : "all" })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
