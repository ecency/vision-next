import { NextRequest, NextResponse } from "next/server";
import {
  clearAllHiddenMessages,
  getMattermostTokenFromCookies,
  getHiddenMessages,
  handleMattermostError,
  hideMessage,
  MattermostUser,
  mmUserFetch
} from "@/server/mattermost";

export async function GET() {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);
    const hiddenMessages = await getHiddenMessages(currentUser.id);

    return NextResponse.json(hiddenMessages);
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function POST(req: NextRequest) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { postId, channelId } = body;

    if (!postId || typeof postId !== "string") {
      return NextResponse.json({ error: "postId is required and must be a string" }, { status: 400 });
    }

    if (!channelId || typeof channelId !== "string") {
      return NextResponse.json(
        { error: "channelId is required and must be a string" },
        { status: 400 }
      );
    }

    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);
    const hiddenMessages = await hideMessage(currentUser.id, postId, channelId);

    return NextResponse.json(hiddenMessages);
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function DELETE() {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);
    const count = await clearAllHiddenMessages(currentUser.id);

    return NextResponse.json({ cleared: count });
  } catch (error) {
    return handleMattermostError(error);
  }
}
