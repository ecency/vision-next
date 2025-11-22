import { NextRequest, NextResponse } from "next/server";
import {
  findMattermostUser,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch,
  MattermostUser
} from "@/server/mattermost";

export async function POST(req: NextRequest) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const username = (body.username as string | undefined)?.trim().replace(/^@/, "");

    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    const targetUser = await findMattermostUser(username);

    if (!targetUser) {
      return NextResponse.json(
        { error: `@${username} is not on Ecency chat yet.` },
        { status: 404 }
      );
    }

    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);

    const channel = await mmUserFetch<{ id: string }>(`/channels/direct`, token, {
      method: "POST",
      body: JSON.stringify([currentUser.id, targetUser.id])
    });

    return NextResponse.json({ channelId: channel.id });
  } catch (error) {
    return handleMattermostError(error);
  }
}
