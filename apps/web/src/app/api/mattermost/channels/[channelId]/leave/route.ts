import { NextResponse } from "next/server";
import {
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

export async function POST(_: Request, { params }: { params: Promise<{ channelId: string }> }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { channelId } = await params;
    await mmUserFetch(`/channels/${channelId}/members/me`, token, { method: "DELETE" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
