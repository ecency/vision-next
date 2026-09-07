import { postBodySummary } from "@ecency/render-helper";
import type { Entry } from "@/entities";

/** Length every feed card passes to postBodySummary. */
export const ENTRY_SUMMARY_LENGTH = 200;

/**
 * The plain-text summary a feed card shows under the title.
 *
 * An author-set `json_metadata.description` wins over the generated body
 * summary, but json_metadata is untrusted on-chain data: some publishing clients
 * write the whole markdown body into `description`, others a non-string. The card
 * used to render that value verbatim, so one such post became a wall of raw
 * markdown of unbounded height in the list. Both sources now go through the same
 * summary function, so the card always gets plain text capped at `length`. A
 * description that strips to nothing (an image-only one) falls back to the body.
 */
export function entrySummary(entry: Entry, length: number = ENTRY_SUMMARY_LENGTH): string {
  const declared = entry.json_metadata?.description;
  if (typeof declared === "string" && declared.trim().length > 0) {
    const summary = postBodySummary(declared.trim(), length)?.trim();
    if (summary) {
      return summary;
    }
  }
  return postBodySummary(entry, length)?.trim() ?? "";
}
