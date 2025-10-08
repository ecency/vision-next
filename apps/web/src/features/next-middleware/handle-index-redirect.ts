import { NextRequest, NextResponse } from "next/server";

export function isIndexRedirect(request: NextRequest) {
  return request.cookies.has("active_user") && request.nextUrl.pathname === "/";
}

export function handleIndexRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = `/hot`;

  const activeUser = request.cookies.get("active_user")?.value;
  if (activeUser) {
    url.pathname = `/@${activeUser}/feed`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.rewrite(url);
}
