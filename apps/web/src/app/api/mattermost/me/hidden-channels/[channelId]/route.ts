import { NextRequest, NextResponse } from "next/server";
import {
  getMattermostTokenFromCookies,
  handleMattermostError,
  MattermostUser,
  mmUserFetch,
  unhideChannel
} from "@/server/mattermost";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { channelId } = await params;

    if (!channelId) {
      return NextResponse.json({ error: "channelId is required" }, { status: 400 });
    }

    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);
    const hiddenChannels = await unhideChannel(currentUser.id, channelId);

    return NextResponse.json(hiddenChannels);
  } catch (error) {
    return handleMattermostError(error);
  }
}
