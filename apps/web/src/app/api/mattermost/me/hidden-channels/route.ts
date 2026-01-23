import { NextRequest, NextResponse } from "next/server";
import {
  getMattermostTokenFromCookies,
  getHiddenChannels,
  handleMattermostError,
  hideChannel,
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
    const hiddenChannels = await getHiddenChannels(currentUser.id);

    return NextResponse.json(hiddenChannels);
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
    const { channelId } = body;

    if (!channelId || typeof channelId !== "string") {
      return NextResponse.json(
        { error: "channelId is required and must be a string" },
        { status: 400 }
      );
    }

    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);
    const hiddenChannels = await hideChannel(currentUser.id, channelId);

    return NextResponse.json(hiddenChannels);
  } catch (error) {
    return handleMattermostError(error);
  }
}
