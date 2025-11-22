import { NextRequest, NextResponse } from "next/server";
import { getMattermostTokenFromCookies, handleMattermostError, mmUserFetch } from "@/server/mattermost";

export async function POST(req: NextRequest, { params }: { params: { channelId: string; postId: string } }) {
  const token = getMattermostTokenFromCookies();
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

    await mmUserFetch(`/reactions`, token, {
      method: "POST",
      body: JSON.stringify({ user_id: user.id, post_id: params.postId, emoji_name: emoji })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { channelId: string; postId: string } }) {
  const token = getMattermostTokenFromCookies();
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

    await mmUserFetch(`/reactions`, token, {
      method: "DELETE",
      body: JSON.stringify({ user_id: user.id, post_id: params.postId, emoji_name: emoji })
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleMattermostError(error);
  }
}
