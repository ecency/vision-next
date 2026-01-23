import { NextRequest, NextResponse } from "next/server";
import {
  getMattermostTeamId,
  getMattermostTokenFromCookies,
  handleMattermostError,
  mmUserFetch
} from "@/server/mattermost";

export async function POST(req: NextRequest) {
  const token = await getMattermostTokenFromCookies();
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const term = (body.term as string | undefined)?.trim();

    if (!term) {
      return NextResponse.json({ error: "term required" }, { status: 400 });
    }

    const teamId = getMattermostTeamId();

    const { order, posts } = await mmUserFetch<{ order: string[]; posts: Record<string, any> }>(
      `/teams/${teamId}/posts/search`,
      token,
      {
        method: "POST",
        body: JSON.stringify({
          terms: term,
          is_or_search: false,
          include_deleted_channels: false,
          per_page: 20,
          page: 0
        })
      }
    );

    const orderedPosts = (order || []).map((id) => posts[id]).filter(Boolean);

    return NextResponse.json({ posts: orderedPosts });
  } catch (error) {
    return handleMattermostError(error);
  }
}
