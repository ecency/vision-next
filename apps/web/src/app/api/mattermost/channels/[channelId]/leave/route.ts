import { NextResponse } from "next/server";
import {
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

export async function POST(_: Request, { params }: { params: { channelId: string } }) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    await mmUserFetch(`/channels/${params.channelId}/leave`, token, { method: "POST" });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
