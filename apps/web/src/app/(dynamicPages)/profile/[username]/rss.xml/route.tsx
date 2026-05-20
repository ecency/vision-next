import { NextRequest } from "next/server";
import { AccountRssHandler } from "@/features/rss";
import { RSS_CACHE_HEADERS, emptyRssResponse } from "@/features/rss";

interface Props {
  params: Promise<{ username: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { username } = await params;

  try {
    const xml = (
      await new AccountRssHandler(request.nextUrl.pathname, username.replace("%40", "")).getFeed()
    ).xml();
    return new Response(xml, {
      headers: { "Content-Type": "text/xml", ...RSS_CACHE_HEADERS }
    });
  } catch (e) {
    return emptyRssResponse();
  }
}
