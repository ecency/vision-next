import { NextRequest } from "next/server";
import { AccountRssHandler } from "@/features/rss";

interface Props {
  params: Promise<{ community: string; tag: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { community, tag } = await params;
  return new Response(
    (await new AccountRssHandler(request.nextUrl.pathname, community, tag).getFeed()).xml(),
    { headers: { "Content-Type": "text/xml" } }
  );
}
