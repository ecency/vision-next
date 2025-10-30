import { NextRequest, NextResponse } from "next/server";
import { handleIndexRedirect, isIndexRedirect } from "@/features/next-middleware";

export function middleware(request: NextRequest) {
  if (request.method !== "GET") return;

  if (isIndexRedirect(request)) {
    return handleIndexRedirect(request);
  }

  // Decode URL and redirect if needed
  const path = request.nextUrl.pathname;
  try {
    const decodedPath = decodeURIComponent(path);
    if (decodedPath !== path) {
      const url = request.nextUrl.clone();
      url.pathname = decodedPath;
      return NextResponse.redirect(url);
    }
  } catch (e) {
    if (e instanceof URIError) {
      console.warn("Failed to decode request path", path, e);
    } else {
      throw e;
    }
  }

  // block invalid permlinks with file extensions
  if (path.match(/^\/[^\/]+\/@[\w\d.-]+\/[a-z0-9-]+\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    console.warn("Blocked invalid permlink with file extension:", path);
    return new NextResponse("Not found", { status: 404 });
  }

  const userAgent = request.headers.get("user-agent") || "";
  const isSocialBot = /redditbot/i.test(userAgent);

  if (isSocialBot && path.match(/^\/[^\/]+\/@[^\/]+\/[^\/]+$/)) {
    const nextUrl = request.nextUrl.clone();
    nextUrl.pathname += "/redditbot";
    return NextResponse.rewrite(nextUrl);
  }

  return NextResponse.next();
}
