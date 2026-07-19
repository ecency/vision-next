import { NextRequest, NextResponse } from "next/server";
import {
  ensureUserInChannel,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

export async function POST(req: NextRequest, { params }: { params: Promise<{ channelId: string; postId: string }> }) {
  const { channelId, postId } = await params;
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const emoji = (body.emoji as string | undefined)?.trim();

    if (!emoji) {
      return NextResponse.json({ error: "emoji required" }, { status: 400 });
    }

    const user = await mmUserFetch<{ id: string }>(`/users/me`, token);

    await ensureUserInChannel(user.id, channelId);

    const reaction = await mmUserFetch<{ user_id: string; post_id: string; emoji_name: string }>(
      `/reactions`,
      token,
      {
        method: "POST",
        body: JSON.stringify({ user_id: user.id, post_id: postId, emoji_name: emoji })
      }
    );

    return NextResponse.json(reaction);
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ channelId: string; postId: string }> }) {
  const { channelId, postId } = await params;
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const emoji = (body.emoji as string | undefined)?.trim();

    if (!emoji) {
      return NextResponse.json({ error: "emoji required" }, { status: 400 });
    }

    const user = await mmUserFetch<{ id: string }>(`/users/me`, token);

    await ensureUserInChannel(user.id, channelId);

    await mmUserFetch(
      `/users/${user.id}/posts/${encodeURIComponent(postId)}/reactions/${encodeURIComponent(emoji)}`,
      token,
      {
        method: "DELETE"
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
