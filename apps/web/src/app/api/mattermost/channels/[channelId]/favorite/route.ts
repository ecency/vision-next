import { NextRequest, NextResponse } from "next/server";
import {
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
    const currentUser = await mmUserFetch<{ id: string }>(`/users/me`, token);
    const path = `/users/${currentUser.id}/channels/${params.channelId}/favorite`;

    await mmUserFetch(path, token, { method: favorite ? "POST" : "DELETE" });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
