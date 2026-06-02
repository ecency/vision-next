import { isCommunity } from "./is-community";
import { EntryFilter } from "@/enums";

export function makePath(filter: string, tag: string): string {
  // created is default filter for community pages
  if (isCommunity(tag)) {
    return `/${EntryFilter.created}/${tag}`;
  }

  // @ts-ignore
  if (EntryFilter[filter] === undefined) {
    return `/${EntryFilter.created}/${tag}`;
  }

  return `/${filter}/${tag}`;
}

export function makeEntryPath(
  category: string,
  author: string,
  permlink?: string,
  toReplies: boolean = false
) {
  if (
    !author ||
    !permlink ||
    typeof permlink !== "string" ||
    permlink === "undefined" ||
    permlink.trim().length === 0
  ) {
    return "#";
  }

  const sanitizedPermlink = permlink.trim();

  // Canonical post URL is the bare "/@author/permlink" form. The leading
  // `category` segment is intentionally omitted: next.config.js issues a 308
  // redirect from /:category/@author/:permlink onto the bare form, so emitting
  // category here would only force every internal link through a redirect hop.
  // The `category` param is retained for call-site compatibility (the entry
  // route rewrites still accept an optional category segment).
  return `/@${author}/${sanitizedPermlink}${toReplies ? "#replies" : ""}`;
}
