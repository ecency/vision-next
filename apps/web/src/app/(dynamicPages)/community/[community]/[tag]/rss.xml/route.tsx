import { NextRequest } from "next/server";
import { CommunityRssHandler } from "@/features/rss";
import { RSS_CACHE_HEADERS, emptyRssResponseWithReport } from "@/features/rss";

interface Props {
  params: Promise<{ community: string; tag: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { community, tag } = await params;
  try {
    const xml = (
      await new CommunityRssHandler(request.nextUrl.pathname, community, tag).getFeed()
    ).xml();
    return new Response(xml, {
      headers: { "Content-Type": "text/xml", ...RSS_CACHE_HEADERS }
    });
  } catch (e) {
    return emptyRssResponseWithReport(e, {
      route: "community/[community]/[tag]/rss.xml",
      pathname: request.nextUrl.pathname
    });
  }
}
