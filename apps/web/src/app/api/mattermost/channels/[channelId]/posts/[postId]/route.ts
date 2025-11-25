import { NextResponse } from "next/server";
import {
  deleteMattermostPostAsAdmin,
  getMattermostCommunityModerationContext,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
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

export async function PATCH(req: Request, { params }: { params: { channelId: string; postId: string } }) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = (body?.message as string | undefined)?.trim();

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const post = await mmUserFetch(`/posts/${params.postId}/patch`, token, {
      method: "PUT",
      body: JSON.stringify({ message })
    });

    return NextResponse.json({ post });
  } catch (error) {
    return handleMattermostError(error);
  }
}
