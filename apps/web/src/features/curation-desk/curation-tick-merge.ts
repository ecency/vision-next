import type { InfiniteData } from "@tanstack/react-query";
import type {
  CurationMark,
  CurationOverlay,
  CurationRosterFeedPage,
  CurationTickResponse,
} from "@ecency/sdk";
import { rowHiddenByFeed, type FeedFilters } from "./curation-feed-rules";
import { parseChainDate } from "./curation-window";
import type { DeskRow } from "./types";

function emptyOverlay(): CurationOverlay {
  return {
    signals: null,
    flags: {},
    excluded_reason: null,
    team_mark: null,
    team_mark_by: null,
    resurfaced_at: null,
    marks: [],
    notes_count: 0,
  };
}

/**
 * A delta carries `has_note`, never the body (notes are only in the roster
 * feed and the overlay), so a mark with no `note` field says nothing about
 * whether a note exists.
 */
function markHasNote(mark: CurationMark): boolean {
  if (typeof mark.has_note === "boolean") return mark.has_note;
  return mark.state === "noted" || !!mark.note;
}

function upsertMark(marks: CurationMark[], mark: CurationMark): CurationMark[] {
  const index = marks.findIndex((m) => m.curator === mark.curator);
  if (index === -1) return [...marks, mark];
  const existing = marks[index];
  if (existing.updated_at >= mark.updated_at) return marks;
  const next = marks.slice();
  // Merge rather than replace: the note-less delta would otherwise drop a
  // colleague's note body that the feed already delivered.
  next[index] = {
    ...mark,
    note: mark.has_note === false ? null : (mark.note ?? existing.note),
    has_note: mark.has_note ?? markHasNote(existing),
  };
  return next;
}

type RowStateDelta = NonNullable<CurationTickResponse["deltas"]["rows"]>[number];

/**
 * Does this description differ from what the row already holds? The tick names
 * every visible row, so without this every one of them would be a new object on
 * every tick and the memoized rows would all re-render four times a minute.
 */
function rowStateChanged(row: DeskRow, next: RowStateDelta): boolean {
  return (
    row.state !== next.state ||
    (row.unvoted_at ?? null) !== (next.unvoted_at ?? null) ||
    JSON.stringify(row.trailed_by ?? null) !== JSON.stringify(next.trailed_by ?? null) ||
    JSON.stringify(row.voted_by ?? []) !== JSON.stringify(next.voted_by ?? [])
  );
}

/**
 * Team level = the newest mark on the row. A snooze that has run out is no
 * mark any more: the server's minute job clears the team level then but
 * leaves the mark row, which the feed still delivers, so counting it would
 * snooze a resurfaced post again the moment any other mark reaches it.
 */
function teamLevel(marks: CurationMark[], now: number): Pick<CurationOverlay, "team_mark" | "team_mark_by" | "team_snooze_until"> {
  const newest = marks
    .filter((m) => m.state !== "noted" && !snoozeExpired(m, now))
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];
  return {
    team_mark: newest?.state ?? null,
    team_mark_by: newest?.curator ?? null,
    team_snooze_until: newest?.state === "snoozed" ? newest.snooze_until ?? null : null,
  };
}

function snoozeExpired(mark: CurationMark, now: number): boolean {
  if (mark.state !== "snoozed") return false;
  const until = parseChainDate(mark.snooze_until);
  return until != null && until <= now;
}

export interface TickMergeOptions {
  /**
   * The filters of the feed these pages belong to. A row the tick moves
   * outside them (curated while the queue hides curated posts, reviewed by a
   * colleague while it shows unreviewed posts only) leaves the list now,
   * rather than sitting there until the next refresh serves the page without
   * it. Without this every described row stays and only its badge changes.
   */
  feed?: FeedFilters;
  /** The clock a snooze is judged against; defaults to Date.now(). */
  now?: number;
}

/**
 * Apply one tick response to the loaded roster pages. Rows the tick did not
 * touch are returned as the SAME object, so memoized row components skip their
 * render; pages with no changed row keep their identity too.
 */
export function mergeTickIntoPages(
  data: InfiniteData<CurationRosterFeedPage, unknown> | undefined,
  tick: CurationTickResponse,
  options: TickMergeOptions = {}
): InfiniteData<CurationRosterFeedPage, unknown> | undefined {
  if (!data) return data;

  const overlayById = new Map<number, CurationOverlay>();
  for (const item of tick.overlay ?? []) {
    const { post_id, ...overlay } = item;
    overlayById.set(post_id, overlay);
  }
  const marksById = new Map<number, CurationMark[]>();
  for (const item of tick.deltas?.marks ?? []) {
    const { post_id, ...mark } = item;
    const list = marksById.get(post_id) ?? [];
    list.push(mark);
    marksById.set(post_id, list);
  }
  const flagsById = new Map(
    (tick.deltas?.flags ?? []).map((f) => [f.post_id, f] as const)
  );
  const signalsById = new Map(
    (tick.deltas?.signals ?? []).map((s) => [s.post_id, s.signals] as const)
  );
  // The overlay carries no curation state, so this is the only thing that
  // tells a page the client keeps holding that a post has since been curated.
  // The route describes every visible row, changed or not, because no candidate
  // timestamp covers all the writes that matter: deciding what actually moved is
  // this side's job, and skipping the rest is what keeps the row identities.
  const rowsById = new Map(
    (tick.deltas?.rows ?? []).map((r) => [r.post_id, r] as const)
  );

  if (!overlayById.size && !marksById.size && !flagsById.size && !signalsById.size && !rowsById.size) {
    return data;
  }
  const now = options.now ?? Date.now();

  /** The row with this tick applied, or the same object when nothing on it moved. */
  const mergeRow = (row: DeskRow): DeskRow => {
    const id = row.post_id;
    const fullOverlay = overlayById.get(id);
    const marks = marksById.get(id);
    const flags = flagsById.get(id);
    const signals = signalsById.get(id);
    const described = rowsById.get(id);
    const state = described && rowStateChanged(row, described) ? described : undefined;
    const hasOverlayNews = !!fullOverlay || !!marks || !!flags || signals !== undefined;
    if (!hasOverlayNews && !state) return row;
    // A state-only delta must NOT invent an overlay. The next tick asks for a full
    // overlay only for rows that still have none (`need`), so fabricating an empty
    // one here would permanently convince the client that this row's marks, flags
    // and signals were already loaded.
    if (!hasOverlayNews) return { ...row, ...state };

    let overlay: CurationOverlay = fullOverlay ?? row.overlay ?? emptyOverlay();
    if (marks) {
      let list = overlay.marks;
      for (const mark of marks) list = upsertMark(list, mark);
      overlay = {
        ...overlay,
        marks: list,
        ...teamLevel(list, now),
        notes_count: list.filter(markHasNote).length,
      };
    }
    if (flags) {
      overlay = { ...overlay, flags: flags.flags, excluded_reason: flags.excluded_reason };
    }
    if (signals !== undefined) {
      overlay = { ...overlay, signals };
    }
    // `state` names only the fields it carries, so nothing else on the row
    // is touched: `unvoted_at` back to null is a real value, not an absence.
    return state ? { ...row, ...state, overlay } : { ...row, overlay };
  };

  let anyPageChanged = false;
  const pages = data.pages.map((page) => {
    let pageChanged = false;
    const items: DeskRow[] = [];
    for (const row of page.items) {
      const next = mergeRow(row);
      if (next === row) {
        items.push(row);
        continue;
      }
      pageChanged = true;
      // Only a row this tick changed is judged: what the server served as is
      // stays until the server says otherwise.
      if (options.feed && rowHiddenByFeed(next, options.feed)) continue;
      items.push(next);
    }
    if (!pageChanged) return page;
    anyPageChanged = true;
    // The loaded rows are roster rows with a nullable overlay; the page type
    // is stricter than the merge needs to be, as the original map was too.
    return { ...page, items: items as CurationRosterFeedPage["items"] };
  });

  return anyPageChanged ? { ...data, pages } : data;
}

/** Replace one row (by post_id) across the loaded pages, keeping every other object. */
export function replaceRowInPages<TPage extends { items: DeskRow[] }>(
  data: InfiniteData<TPage, unknown> | undefined,
  next: DeskRow
): InfiniteData<TPage, unknown> | undefined {
  // The `latest` key of the status poll holds a single page object, not an
  // InfiniteData; setQueriesData hands it to this updater too.
  if (!data || !Array.isArray(data.pages)) return data;
  let changed = false;
  const pages = data.pages.map((page) => {
    const index = page.items.findIndex((r) => r.post_id === next.post_id);
    if (index === -1) return page;
    changed = true;
    const items = page.items.slice();
    // Server rows may omit the overlay on a public shape; keep what we had.
    items[index] = { ...items[index], ...next, overlay: next.overlay ?? items[index].overlay };
    return { ...page, items };
  });
  return changed ? { ...data, pages } : data;
}

/** Drop one row (by post_id) from the loaded pages, keeping every other object. */
export function removeRowFromPages<TPage extends { items: DeskRow[] }>(
  data: InfiniteData<TPage, unknown> | undefined,
  postId: number
): InfiniteData<TPage, unknown> | undefined {
  if (!data || !Array.isArray(data.pages)) return data;
  let changed = false;
  const pages = data.pages.map((page) => {
    if (!page.items.some((r) => r.post_id === postId)) return page;
    changed = true;
    return { ...page, items: page.items.filter((r) => r.post_id !== postId) };
  });
  return changed ? { ...data, pages } : data;
}

export interface RowPosition {
  page: number;
  index: number;
  /** The feed's order, so a row can go back to its PLACE when its index moved. */
  sort?: string;
}

/** Row `a` sorts before row `b` under a chronological order; null for any other order. */
function sortsBefore(a: DeskRow, b: DeskRow, sort: string | undefined): boolean | null {
  if (sort !== "queue" && sort !== "newest") return null;
  const ca = parseChainDate(a.created) ?? 0;
  const cb = parseChainDate(b.created) ?? 0;
  if (ca !== cb) return sort === "queue" ? ca < cb : ca > cb;
  return sort === "queue" ? a.post_id < b.post_id : a.post_id > b.post_id;
}

/** Where a row sits in the loaded pages, or null when it is not loaded. */
export function findRowPosition<TPage extends { items: DeskRow[] }>(
  data: InfiniteData<TPage, unknown> | undefined,
  postId: number
): RowPosition | null {
  if (!data || !Array.isArray(data.pages)) return null;
  for (let page = 0; page < data.pages.length; page++) {
    const index = data.pages[page].items.findIndex((r) => r.post_id === postId);
    if (index !== -1) return { page, index };
  }
  return null;
}

/**
 * Put a row back where it belongs after an undone mark. Under a chronological
 * order that is its place in the order, whatever left or arrived meanwhile;
 * under any other order it is the slot it held, clamped to what is loaded. A
 * row that is still loaded is replaced in place instead.
 */
export function insertRowInPages<TPage extends { items: DeskRow[] }>(
  data: InfiniteData<TPage, unknown> | undefined,
  row: DeskRow,
  at: RowPosition
): InfiniteData<TPage, unknown> | undefined {
  if (!data || !Array.isArray(data.pages) || data.pages.length === 0) return data;
  if (findRowPosition(data, row.post_id)) return replaceRowInPages(data, row);
  let page = Math.min(Math.max(0, at.page), data.pages.length - 1);
  let index = Math.min(Math.max(0, at.index), data.pages[page].items.length);
  if (at.sort === "queue" || at.sort === "newest") {
    // The first loaded row that sorts after it; none means the end of the
    // last page, which is also where the server would serve it next.
    page = data.pages.length - 1;
    index = data.pages[page].items.length;
    outer: for (let p = 0; p < data.pages.length; p++) {
      for (let i = 0; i < data.pages[p].items.length; i++) {
        if (sortsBefore(row, data.pages[p].items[i], at.sort)) {
          page = p;
          index = i;
          break outer;
        }
      }
    }
  }
  const pages = data.pages.slice();
  const items = pages[page].items.slice();
  items.splice(index, 0, row);
  pages[page] = { ...pages[page], items };
  return { ...data, pages };
}
