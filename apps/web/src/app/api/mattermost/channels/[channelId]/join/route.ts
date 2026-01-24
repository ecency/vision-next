import { NextResponse } from "next/server";
import {
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

interface MattermostUser {
  id: string;
}

export async function POST(_: Request, { params }: { params: Promise<{ channelId?: string }> }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { channelId } = await params;
  if (!channelId) {
    return NextResponse.json({ error: "channelId missing" }, { status: 400 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);

    await mmUserFetch(`/channels/${channelId}/members`, token, {
      method: "POST",
      body: JSON.stringify({ channel_id: channelId, user_id: currentUser.id })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
