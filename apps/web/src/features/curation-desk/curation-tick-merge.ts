import type { InfiniteData } from "@tanstack/react-query";
import type {
  CurationMark,
  CurationOverlay,
  CurationRosterFeedPage,
  CurationTickResponse,
} from "@ecency/sdk";
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

/** Team level = the newest mark on the row. */
function teamLevel(marks: CurationMark[]): Pick<CurationOverlay, "team_mark" | "team_mark_by" | "team_snooze_until"> {
  const newest = marks
    .filter((m) => m.state !== "noted")
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))[0];
  return {
    team_mark: newest?.state ?? null,
    team_mark_by: newest?.curator ?? null,
    team_snooze_until: newest?.state === "snoozed" ? newest.snooze_until ?? null : null,
  };
}

export interface TickMergeOptions {
  /**
   * The queue is hiding curated posts, so a row the tick reports as curated
   * leaves the list now rather than sitting there as a curated card until the
   * next refresh serves the page without it.
   */
  dropCurated?: boolean;
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
        ...teamLevel(list),
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
      const described = rowsById.get(row.post_id);
      // The curator asked not to see curated posts, and this one just was:
      // it leaves now, rather than turning into a curated card that sits in
      // the queue until the next refresh happens to drop it.
      if (options.dropCurated && described && described.state !== 0 && row.state === 0) {
        pageChanged = true;
        continue;
      }
      const next = mergeRow(row);
      if (next !== row) pageChanged = true;
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
