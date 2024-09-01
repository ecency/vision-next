import { NextRequest, NextResponse } from "next/server";
import { ProfileFilter } from "@/enums";

export function handleEntriesRedirect(request: NextRequest) {
  const profileSections = [...Object.values(ProfileFilter), "communities", "likes", "wallet"];
  const isAnySection = profileSections.some((section) => request.url.includes(section));
  const isEntryLikePage = /\/(@.+)\/(.+)/gm.test(request.nextUrl.pathname);

  if (!isAnySection && isEntryLikePage) {
    const [author, permlink] = request.nextUrl.pathname.split("/").filter((i) => !!i);

    if (author.startsWith("@")) {
      const url = request.nextUrl.clone();
      url.pathname = `/ecency/${author}/${permlink}`;
      return NextResponse.redirect(url);
    }
  }
}
