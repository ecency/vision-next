import { NextRequest } from "next/server";
import { AccountRssHandler } from "@/features/rss";

interface Props {
  params: Promise<{ username: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  const { username } = await params;
  return new Response(
    (
      await new AccountRssHandler(request.nextUrl.pathname, username.replace("%40", "")).getFeed()
    ).xml(),
    { headers: { "Content-Type": "text/xml" } }
  );
}
