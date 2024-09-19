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
    "feed",
    "referrals",
    "permissions"
  ];
  const isAnySection = profileSections.some((section) => request.url.includes(section));
  const isEntryLikePage = /\/(@.+)\/(.+)/gm.test(request.nextUrl.pathname);
  const [author] = request.nextUrl.pathname.split("/").filter((i) => !!i);

  return !isAnySection && isEntryLikePage && author.startsWith("@");
}

export function handleEntriesRedirect(request: NextRequest) {
  const [author, permlink] = request.nextUrl.pathname.split("/").filter((i) => !!i);

  const url = request.nextUrl.clone();
  url.pathname = `/ecency/${author}/${permlink}`;
  return NextResponse.redirect(url);
}
