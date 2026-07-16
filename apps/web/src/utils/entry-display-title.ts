import { postBodySummary } from "@ecency/render-helper";
import type { Entry } from "@/entities";
import { truncate } from "./truncate";

/**
 * Non-empty display title for an entry. Microblog-style root posts (e.g.
 * D.Buzz) legitimately carry an empty on-chain title; every title surface
 * (page <title>, og/twitter cards, BlogPosting headline, BreadcrumbList item
 * names) falls back to a short body summary, then to a generic byline —
 * Google rejects structured data whose breadcrumb name is empty.
 */
export function entryDisplayTitle(entry: Pick<Entry, "title" | "body" | "author">): string {
  return (
    (entry.title ?? "").trim() ||
    truncate(postBodySummary(entry.body, 67), 67) ||
    `Post by @${entry.author}`
  );
}
