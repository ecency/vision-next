import { NextRequest, NextResponse } from "next/server";
import { ProfileFilter } from "@/enums";

export function isEntriesRedirect(request: NextRequest) {
  const profileSections = [
    ...Object.values(ProfileFilter),
    "communities",
    "trail",
    "wallet",
    "points",
    "spk",
    "engine",
    "settings",
    "insights",
    "feed",
    "referrals",
    "permissions",
    "rss",
    "rss.xml"
  ];
  const isAnySection = profileSections.some((section) => request.url.includes(section));
  const isEntryLikePage = /\/(@.+)\/(.+)/gm.test(request.nextUrl.pathname);
  const [author] = request.nextUrl.pathname.split("/").filter((i) => !!i);
  const isEditPage = request.nextUrl.pathname.endsWith("/edit");

  return !isEditPage && !isAnySection && isEntryLikePage && author.startsWith("@");
}

export function handleEntriesRedirect(request: NextRequest) {
  const [author, permlink] = request.nextUrl.pathname.split("/").filter((i) => !!i);

  const url = request.nextUrl.clone();
  url.pathname = `/post/${author}/${permlink}`;
  return NextResponse.redirect(url);
}
