import { NextRequest, NextResponse } from "next/server";

export function isIndexRedirect(request: NextRequest) {
  return request.cookies.has("active_user") && request.nextUrl.pathname === "/";
}

export function handleIndexRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = `/hot`;
  return NextResponse.rewrite(url);
}
