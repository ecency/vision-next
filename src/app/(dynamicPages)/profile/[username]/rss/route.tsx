import { NextRequest } from "next/server";
import { AccountRssHandler } from "@/features/rss";

interface Props {
  params: { username: string };
}

export async function GET(request: NextRequest, { params: { username } }: Props) {
  return new Response(
    (
      await new AccountRssHandler(request.nextUrl.pathname, username.replace("%40", "")).getFeed()
    ).xml(),
    { headers: { "Content-Type": "text/xml" } }
  );
}
