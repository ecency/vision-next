import { NextRequest } from "next/server";
import { CommunityRssHandler } from "@/features/rss";

interface Props {
  params: { community: string; tag: string };
}

export async function GET(request: NextRequest, { params: { community, tag } }: Props) {
  return new Response(
    (await new CommunityRssHandler(request.nextUrl.pathname, community, tag).getFeed()).xml(),
    { headers: { "Content-Type": "text/xml" } }
  );
}
