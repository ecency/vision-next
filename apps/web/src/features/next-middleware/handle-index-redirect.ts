import { NextRequest, NextResponse } from "next/server";

export function isIndexRedirect(request: NextRequest) {
  return request.cookies.has("active_user") && request.nextUrl.pathname === "/";
}

export function handleIndexRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Only logged-in "/" requests reach here (see isIndexRedirect). A 307 redirect
  // (not a rewrite) keeps the URL honest so the feed route applies its own cache
  // policy, analytics records the real path, and usePathname matches the content.
  // Crawler-neutral: bots are anonymous and never trigger this branch.
  const activeUser = request.cookies.get("active_user")?.value;
  url.pathname = activeUser ? `/@${activeUser}/feed` : `/hot`;
  return NextResponse.redirect(url, 307);
}
