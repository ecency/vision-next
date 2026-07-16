import { truncate } from "@/utils";
import { entryDisplayTitle } from "@/utils/entry-display-title";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import type { Entry } from "@/entities";

export interface EntryCardFields {
  /** ≤67-char title; for a comment, "@author: <body summary>". */
  title: string;
  /**
   * ≤160-char summary (author-set description wins). MAY BE EMPTY for
   * media-only posts — the SERP meta description deliberately stays empty so
   * Google auto-snippets from page content instead of sitewide boilerplate.
   */
  summary: string;
  /**
   * `summary`, or a minimal descriptive fallback when it is empty. For card
   * surfaces (og/twitter/oEmbed) that have no auto-snippet and must not render
   * an empty description.
   */
  cardSummary: string;
  /** 1200×630 cover image, or null when the post has none. */
  image: string | null;
  isComment: boolean;
}

/**
 * The shared title / summary / image rules for an entry's "card" form.
 *
 * Single source of truth so the OpenGraph + Twitter meta tags
 * (generate-entry-metadata) and the oEmbed provider response can never drift
 * apart. Pure / fetch-free, exactly like entry-agent-format, so the contract
 * is trivially unit-tested.
 */
export function buildEntryCardFields(entry: Entry): EntryCardFields {
  const isComment = !!entry.parent_author;

  // entryDisplayTitle never returns "" (title-less microblog posts fall back
  // to a body summary, then a byline), so the page <title>, og/twitter cards
  // and oEmbed can't render an empty title.
  let title = truncate(entryDisplayTitle(entry), 67);
  if (isComment) {
    const rawCommentTitle = truncate(postBodySummary(entry.body, 12), 67);
    title = `@${entry.author}: ${rawCommentTitle}`;
  }

  // Cap at 160 chars to match Google's desktop snippet width; consumers may
  // truncate further. An author-set json_metadata.description wins (guarded:
  // json_metadata is untrusted on-chain data, a non-string value would leak
  // "[object Object]" into cards).
  const declared = entry.json_metadata?.description;
  const summary =
    (typeof declared === "string" ? declared : "") ||
    truncate(postBodySummary(entry.body, 210), 160);

  // Media-only posts (image/video, no prose) summarize to "". Card surfaces
  // (og/twitter/oEmbed) must not render an empty description, so give THEM a
  // minimal descriptive line — while `summary` stays empty so the SERP meta
  // description keeps Google's (usually better) auto-snippet. Built lazily:
  // the common non-empty case never pays for it.
  let cardSummary = summary;
  if (!cardSummary) {
    const rawTags = entry.json_metadata?.tags;
    const tags = (Array.isArray(rawTags) ? rawTags : []).filter(
      (t): t is string => typeof t === "string" && t.length > 0
    );
    cardSummary = truncate(
      isComment
        ? `A reply by @${entry.author} on Ecency`
        : `A post by @${entry.author}${entry.community_title ? ` in ${entry.community_title}` : ""} on Ecency${
            tags.length ? `. Tags: ${tags.slice(0, 3).join(", ")}` : ""
          }`,
      160
    );
  }

  const image = catchPostImage(entry, 1200, 630, "match");

  return { title, summary, cardSummary, image, isComment };
}
