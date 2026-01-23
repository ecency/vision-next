import { NextRequest, NextResponse } from "next/server";
import {
  getMattermostTokenFromCookies,
  handleMattermostError,
  MattermostUser,
  mmUserFetch,
  unhideMessage
} from "@/server/mattermost";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    const currentUser = await mmUserFetch<MattermostUser>(`/users/me`, token);
    const hiddenMessages = await unhideMessage(currentUser.id, postId);

    return NextResponse.json(hiddenMessages);
  } catch (error) {
    return handleMattermostError(error);
  }
}
