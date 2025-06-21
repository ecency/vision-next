import { NextRequest, NextResponse } from "next/server";
import { handleIndexRedirect, isIndexRedirect } from "@/features/next-middleware";

export function middleware(request: NextRequest) {
  if (request.method !== "GET") return;

  if (isIndexRedirect(request)) {
    return handleIndexRedirect(request);
  }

  return NextResponse.next();
}

