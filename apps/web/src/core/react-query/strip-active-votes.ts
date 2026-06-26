import type { DehydratedState } from "@tanstack/react-query";
import type { Entry } from "@/entities";

/**
 * Drop the full `active_votes` array from entries in a dehydrated React Query
 * state before it is streamed to the client.
 *
 * `bridge.get_post` / `bridge.get_ranked_posts` return every vote as a
 * `{ voter, rshares }` record. On a high-vote post or a tag/community feed that
 * is tens to hundreds of KB of voter data that:
 *   - anonymous visitors (the bulk of cold-load / crawler traffic) never read, and
 *   - logged-in clients only read after hydration to colour the vote button.
 * The full voter list shown in the votes dialog is already fetched on demand
 * (`getEntryActiveVotesQueryOptions`) when the dialog opens, so the eager copy is
 * redundant. Removing it shrinks the streamed payload + client JSON parse /
 * hydration cost (a TTI/INP/bandwidth win — the LCP text already paints from HTML).
 *
 * Hydration-safety: we only strip entries that also carry `stats.total_votes`, so
 * every consumer keeps a stable vote COUNT (`isHiddenPost` reads it), and we CLONE
 * rather than mutate — the server render and SEO indexability read the live
 * (un-dehydrated) cache, which keeps the full data.
 */

function isStripableEntry(value: unknown): value is Entry {
  if (!value || typeof value !== "object") {
    return false;
  }
  const entry = value as Entry;
  // Strip only when a vote COUNT survives elsewhere, so consumers stay
  // hydration-stable: posts carry it on stats.total_votes; search results carry
  // it as a top-level total_votes.
  const hasCount =
    typeof entry.stats?.total_votes === "number" || typeof entry.total_votes === "number";
  return Array.isArray(entry.active_votes) && entry.active_votes.length > 0 && hasCount;
}

function stripEntry<T>(value: T): T {
  return isStripableEntry(value) ? ({ ...value, active_votes: [] } as T) : value;
}

function stripEntryArray<T>(items: T[]): T[] {
  let changed = false;
  const next = items.map((item) => {
    const stripped = stripEntry(item);
    if (stripped !== item) {
      changed = true;
    }
    return stripped;
  });
  return changed ? next : items;
}

// A feed page is either an Entry[] (ranked/account posts) or a search response
// object that holds the entries under `results`.
function stripPage(page: unknown): unknown {
  if (Array.isArray(page)) {
    return stripEntryArray(page);
  }
  if (page && typeof page === "object" && Array.isArray((page as { results?: unknown }).results)) {
    const results = stripEntryArray((page as { results: unknown[] }).results);
    return results === (page as { results: unknown[] }).results ? page : { ...page, results };
  }
  return page;
}

function stripQueryData(data: unknown): unknown {
  if (!data || typeof data !== "object") {
    return data;
  }
  // Infinite query (feed / profile / community): { pages: Page[], pageParams }
  if (Array.isArray((data as { pages?: unknown }).pages)) {
    const pages = (data as { pages: unknown[] }).pages;
    let changed = false;
    const next = pages.map((page) => {
      const stripped = stripPage(page);
      if (stripped !== page) {
        changed = true;
      }
      return stripped;
    });
    return changed ? { ...data, pages: next } : data;
  }
  // Plain array of entries (e.g. a discussion list)
  if (Array.isArray(data)) {
    return stripEntryArray(data as unknown[]);
  }
  // Single entry (post / wave page)
  const single = stripEntry(data);
  if (single !== data) {
    return single;
  }
  // Otherwise it may be a keyed map of entries (e.g. a raw bridge.get_discussion
  // object: { "author/permlink": Entry, ... }). Strip any value that is itself a
  // stripable entry and leave everything else untouched.
  return stripKeyedEntries(data as Record<string, unknown>);
}

function stripKeyedEntries(obj: Record<string, unknown>): Record<string, unknown> {
  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const stripped = stripEntry(value);
    if (stripped !== value) {
      changed = true;
    }
    next[key] = stripped;
  }
  return changed ? next : obj;
}

export function stripActiveVotesFromDehydratedState(
  state: DehydratedState,
  currentUser?: string
): DehydratedState {
  // Only strip for ANONYMOUS requests. Logged-in requests keep the full
  // active_votes: isVoted (the "you voted" highlight) reads them client-side
  // after auth loads, and a logged-in cache variant only ever holds public vote
  // data. Anonymous / crawler requests never need isVoted, and their cache
  // variant carries no user-specific data, so stripping there is safe and
  // shrinks the payload that the bulk of cold-load / SEO traffic downloads.
  if (currentUser) {
    return state;
  }
  return {
    ...state,
    queries: state.queries.map((query) => {
      const data = query.state?.data;
      const stripped = stripQueryData(data);
      if (stripped === data) {
        return query;
      }
      return { ...query, state: { ...query.state, data: stripped } };
    })
  };
}
