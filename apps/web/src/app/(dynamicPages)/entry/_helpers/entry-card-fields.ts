import { truncate } from "@/utils";
import { catchPostImage, postBodySummary } from "@ecency/render-helper";
import type { Entry } from "@/entities";

export interface EntryCardFields {
  /** ≤67-char title; for a comment, "@author: <body summary>". */
  title: string;
  /** ≤160-char summary (author-set description wins). */
  summary: string;
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

  let title = truncate(entry.title, 67);
  if (isComment) {
    const rawCommentTitle = truncate(postBodySummary(entry.body, 12), 67);
    title = `@${entry.author}: ${rawCommentTitle}`;
  }

  // Cap at 160 chars to match Google's desktop snippet width; consumers may
  // truncate further. An author-set json_metadata.description wins.
  const summary =
    entry.json_metadata?.description || truncate(postBodySummary(entry.body, 210), 160);

  const image = catchPostImage(entry, 1200, 630, "match");

  return { title, summary, image, isComment };
}
