import { NextRequest, NextResponse } from "next/server";
import { getMattermostTokenFromCookies, mmUserFetch } from "@/server/mattermost";

export async function GET(_req: NextRequest, { params }: { params: { channelId: string } }) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { posts, order } = await mmUserFetch<{ posts: Record<string, any>; order: string[] }>(
      `/channels/${params.channelId}/posts?per_page=50&page=0`,
      token
    );

    const orderedPosts = order
      .map((id) => posts[id])
      .filter(Boolean)
      .sort((a, b) => Number(a.create_at) - Number(b.create_at));

    return NextResponse.json({ posts: orderedPosts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { channelId: string } }) {
  const token = getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const message = body.message as string;
    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const post = await mmUserFetch(`/posts`, token, {
      method: "POST",
      body: JSON.stringify({ channel_id: params.channelId, message })
    });

    return NextResponse.json({ post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
