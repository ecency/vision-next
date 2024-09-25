import { NextRequest, NextResponse } from "next/server";
import { AccountRssHandler, EntriesRssHandler } from "@/app/api/rss/_handlers";

interface Props {
  searchParams: Record<string, string | undefined>;
}

export async function GET(request: NextRequest, { searchParams }: Props) {
  const { author, community } = searchParams;

  let handler: EntriesRssHandler | undefined;
  if (author) {
    handler = new AccountRssHandler(request.nextUrl.pathname, author);
  }

  if (!handler) {
    return NextResponse.json({ status: 404, statusText: "Not Found" });
  }

  return new Response((await handler.getFeed()).xml(), { headers: { "Content-Type": "text/xml" } });
}
