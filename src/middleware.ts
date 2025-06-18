import { NextRequest, NextResponse } from "next/server";
import { handleIndexRedirect, isIndexRedirect } from "@/features/next-middleware";

export function middleware(request: NextRequest) {
  if (request.method !== "GET") return;

  if (isIndexRedirect(request)) {
    return handleIndexRedirect(request);
  }

  const ua = request.headers.get("user-agent")?.toLowerCase() || "";
  const isBot = /bot|crawl|spider|slurp|embedly|preview|facebookexternalhit|whatsapp|discord|twitter|linkedin/i.test(ua);

  // Optional: rewrite to metadata route for bots
  if (isBot && request.nextUrl.pathname.match(/^\/[^/]+\/@[^/]+\/[^/]+$/)) {
    const [, category, authorRaw, permlink] = request.nextUrl.pathname.split('/');
    const author = authorRaw.replace('@', '');
    return NextResponse.rewrite(
        new URL(`/metadata/entry/${author}/${permlink}`, request.url)
    );
  }

  // Set caching for bots
  const response = NextResponse.next();
  if (isBot) {
    response.headers.set("Cache-Control", "public, max-age=300, stale-while-revalidate=120");
  }

  return response;
}

export const config = {
  matcher: [
    '/:category/@:author/:permlink*',
    '/metadata/entry/:author/:permlink*',
  ],
};
