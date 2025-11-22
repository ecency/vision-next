import { NextResponse } from "next/server";
import { getMattermostTokenFromCookies, mmUserFetch } from "@/server/mattermost";

export async function POST(_: Request, { params }: { params: { channelId: string } }) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await mmUserFetch(`/channels/${params.channelId}/leave`, token, { method: "POST" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
