import { NextRequest } from "next/server";
import { FeedRssHandler } from "@/features/rss";
import { RSS_CACHE_HEADERS, emptyRssResponse } from "@/features/rss";

interface Props {
  params: Promise<{ filter: string; tag: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { filter, tag } = await params;
  try {
    const xml = (
      await new FeedRssHandler(request.nextUrl.pathname, filter, tag).getFeed()
    ).xml();
    return new Response(xml, {
      headers: { "Content-Type": "text/xml", ...RSS_CACHE_HEADERS }
    });
  } catch (e) {
    return emptyRssResponse();
  }
}
