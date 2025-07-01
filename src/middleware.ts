import { NextRequest, NextResponse } from "next/server";
import { handleIndexRedirect, isIndexRedirect } from "@/features/next-middleware";

export function middleware(request: NextRequest) {
  if (request.method !== "GET") return;

  if (isIndexRedirect(request)) {
    return handleIndexRedirect(request);
  }

  // block invalid permlinks with file extensions
  const path = request.nextUrl.pathname;

  if (
      path.match(
          /^\/[^\/]+\/@[\w\d.-]+\/[a-z0-9-]+\.(jpg|jpeg|png|gif|webp|svg)$/i
      )
  ) {
    console.warn("Blocked invalid permlink with file extension:", path);
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.next();
}
