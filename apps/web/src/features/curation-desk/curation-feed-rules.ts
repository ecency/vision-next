import type { DeskRow } from "./types";

/**
 * The filters of a roster feed as they decide which rows the server serves.
 * Read off either the raw request params (booleans) or the normalized query
 * key (strings, defaults dropped): both name the same feed.
 */
export type FeedFilters = Partial<
  Record<"view" | "sort" | "flagged" | "recommended" | "hide_curated" | "hide_reviewed" | "hide_snoozed", string | boolean | undefined>
>;

function flag(value: string | boolean | undefined, fallback: boolean): boolean {
  if (value === undefined || value === null || value === "") return fallback;
  return value !== false && value !== "0";
}

/**
 * Would the roster feed behind `feed` still serve this row? A mirror of the
 * server's own predicate over state, exclusion and the team mark, and the ONE
 * place the client decides that a row it holds has moved outside its feed:
 * a post another curator reviewed leaves an unreviewed-only queue at once, a
 * post that got curated leaves a queue hiding curated posts, and a note keeps
 * a row where it is, because a note is not a team mark.
 *
 * Nothing here touches the predicates the client cannot follow live (age,
 * payout, words, images, app, community): the server serves those.
 */
export function rowHiddenByFeed(row: DeskRow, feed: FeedFilters): boolean {
  const view = typeof feed.view === "string" && feed.view ? feed.view : "queue";
  if (view === "excluded") return false;
  const excluded = row.overlay?.excluded_reason ?? null;
  if (excluded && excluded !== "rep_low") return true;
  if (view === "curated") return row.state !== 1;
  if (view !== "all") {
    const openOnly = flag(feed.hide_curated, true) || flag(feed.recommended, false) || feed.sort === "unique";
    if (openOnly && row.state !== 0) return true;
  }
  const mark = row.overlay?.team_mark ?? null;
  if (flag(feed.flagged, false)) return mark !== "flagged";
  if (flag(feed.hide_reviewed, true) && mark === "reviewed") return true;
  if (flag(feed.hide_snoozed, true) && mark === "snoozed") return true;
  return false;
}
