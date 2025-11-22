import { NextResponse } from "next/server";
import {
  deleteMattermostPostAsAdmin,
  getMattermostCommunityModerationContext,
  getMattermostTokenFromCookies,
  handleMattermostError
} from "@/server/mattermost";

export async function DELETE(_req: Request, { params }: { params: { channelId: string; postId: string } }) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const moderation = await getMattermostCommunityModerationContext(token, params.channelId);

    if (!moderation.canModerate) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    await deleteMattermostPostAsAdmin(params.postId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
