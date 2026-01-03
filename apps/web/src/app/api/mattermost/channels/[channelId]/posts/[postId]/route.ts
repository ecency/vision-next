import { NextResponse } from "next/server";
import {
  deleteMattermostPostAsAdmin,
  getMattermostCommunityModerationContext,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

const SPECIAL_MENTION_REGEX = /(^|\s)@(here|everyone)\b/i;

export async function DELETE(_req: Request, { params }: { params: { channelId: string; postId: string } }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const moderation = await getMattermostCommunityModerationContext(token, params.channelId);
    const post = await mmUserFetch<{ user_id: string }>(`/posts/${params.postId}`, token);

    const isAuthor = post.user_id === moderation.currentUser.id;

    if (!isAuthor && !moderation.canModerate) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    if (isAuthor) {
      await mmUserFetch(`/posts/${params.postId}`, token, { method: "DELETE" });
    } else {
      await deleteMattermostPostAsAdmin(params.postId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { channelId: string; postId: string } }) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = (body?.message as string | undefined)?.trim();

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    if (SPECIAL_MENTION_REGEX.test(message)) {
      const moderation = await getMattermostCommunityModerationContext(token, params.channelId);

      if (!moderation.canModerate) {
        return NextResponse.json(
          { error: "Only community moderators can mention everyone in this channel." },
          { status: 403 }
        );
      }
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
