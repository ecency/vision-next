import { NextRequest, NextResponse } from "next/server";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts/cookies";

export function isIndexRedirect(request: NextRequest) {
  // Require a non-empty value, not just presence: an empty `active_user=` cookie
  // is not a real session, so it should fall through to the anonymous landing
  // page rather than redirect to a feed.
  return (
    request.nextUrl.pathname === "/" &&
    !!request.cookies.get(ACTIVE_USER_COOKIE_NAME)?.value
  );
}

export function handleIndexRedirect(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Only logged-in "/" requests reach here (see isIndexRedirect). A 307 redirect
  // (not a rewrite) keeps the URL honest so the feed route applies its own cache
  // policy, analytics records the real path, and usePathname matches the content.
  // Crawler-neutral: bots are anonymous and never trigger this branch.
  const activeUser = request.cookies.get(ACTIVE_USER_COOKIE_NAME)?.value;
  url.pathname = activeUser ? `/@${activeUser}/feed` : "/hot";
  return NextResponse.redirect(url, 307);
}
