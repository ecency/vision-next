import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider, type InfiniteData } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurationRosterFeedPage, CurationTickResponse } from "@ecency/sdk";
import { installFetchRouter, iso, makeOverlay, makeRosterPage, makeRow } from "./curation-test-utils";

vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
}));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/utils")),
  ensureValidToken: vi.fn(async () => "code-1"),
}));
vi.mock("@/core/hooks/use-active-username", () => ({ useActiveUsername: () => "curator1" }));

import { noteCuratorActivity, useCurationTick } from "@/features/curation-desk/hooks";
import { mergeTickIntoPages } from "@/features/curation-desk/curation-tick-merge";

function tickBody(overrides: Partial<CurationTickResponse> = {}): CurationTickResponse {
  return {
    overlay: [],
    deltas: { marks: [], flags: [], signals: [] },
    team_cursor: { post_id: null, created: null },
    active_curators: [],
    trail_alerts: [],
    generated_at: "2026-09-05T12:00:15.123456Z",
    truncated: false,
    ...overrides,
  };
}

function setVisibility(value: "visible" | "hidden") {
  Object.defineProperty(document, "visibilityState", { value, configurable: true });
}

describe("useCurationTick", () => {
  const feedKey = ["curation", "roster-feed", "curator1", { sort: "queue" }];
  let router: ReturnType<typeof installFetchRouter>;
  let tickResponse = tickBody();
  let queryClient: QueryClient;

  const rowA = makeRow({ post_id: 1, overlay: makeOverlay() });
  const rowB = makeRow({ post_id: 2, overlay: null });

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  function seed() {
    queryClient.setQueryData<InfiniteData<CurationRosterFeedPage>>(feedKey, {
      pages: [makeRosterPage([rowA, rowB])],
      pageParams: [undefined],
    });
  }

  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
    noteCuratorActivity();
    tickResponse = tickBody();
    router = installFetchRouter().on(/curation-desk\/tick/, () => tickResponse);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("does not tick while the tab is hidden", async () => {
    setVisibility("hidden");
    seed();
    renderHook(() => useCurationTick({ username: "curator1", enabled: true, feedKey, rows: [rowA, rowB], getVisibleIds: () => [1, 2] }), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000 * 3);
    });
    expect(router.callsTo(/tick/)).toHaveLength(0);
  });

  /**
   * The tick carries the team hand-off and who is active, so an empty filtered
   * queue is exactly where it has to keep going: the bar is the only thing on
   * screen, and it has to update and to age. The lists just go out empty.
   */
  it("keeps ticking with an empty queue, with empty lists", async () => {
    setVisibility("visible");
    renderHook(() => useCurationTick({ username: "curator1", enabled: true, feedKey, rows: [], getVisibleIds: () => [] }), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(router.callsTo(/tick/)).toHaveLength(1);
    expect(router.callsTo(/tick/)[0].body).toMatchObject({ need: [], visible: [] });
  });

  it("ticks once on visibilitychange and every 15 s while visible", async () => {
    seed();
    renderHook(() => useCurationTick({ username: "curator1", enabled: true, feedKey, rows: [rowA, rowB], getVisibleIds: () => [1, 2] }), { wrapper });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(router.callsTo(/tick/)).toHaveLength(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(router.callsTo(/tick/)).toHaveLength(2);
  });

  it("echoes the previous generated_at as `since` and sends only rows without overlay in `need`", async () => {
    seed();
    renderHook(() => useCurationTick({ username: "curator1", enabled: true, feedKey, rows: [rowA, rowB], getVisibleIds: () => [1, 2, 3] }), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    const first = router.callsTo(/tick/)[0];
    expect(first.body).toMatchObject({ code: "code-1", since: null, need: [2], visible: [1, 2, 3] });

    tickResponse = tickBody({ generated_at: "2026-09-05T12:00:30.000001Z" });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    const second = router.callsTo(/tick/)[1];
    expect(second.body?.since).toBe("2026-09-05T12:00:15.123456Z");
  });

  it("seeds `since` from the loaded feed page instead of asking for everything", async () => {
    seed();
    renderHook(
      () =>
        useCurationTick({
          username: "curator1",
          enabled: true,
          feedKey,
          rows: [rowA, rowB],
          getVisibleIds: () => [1, 2],
          feedGeneratedAt: "2026-09-05T11:59:00.000000Z",
        }),
      { wrapper }
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(router.callsTo(/tick/)[0].body?.since).toBe("2026-09-05T11:59:00.000000Z");
  });

  it("never invalidates the feed on a truncated answer to a since-less tick", async () => {
    seed();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    tickResponse = tickBody({ truncated: true });
    renderHook(() => useCurationTick({ username: "curator1", enabled: true, feedKey, rows: [rowA, rowB], getVisibleIds: () => [1, 2] }), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    // A first tick asks for a snapshot; treating that as truncated would
    // refetch the whole queue on every mount.
    expect(router.callsTo(/tick/)[0].body?.since).toBeNull();
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: feedKey });
  });

  it("discards an answer that arrives after the filters changed", async () => {
    seed();
    const otherKey = ["curation", "roster-feed", "curator1", { sort: "newest" }];
    queryClient.setQueryData<InfiniteData<CurationRosterFeedPage>>(otherKey, {
      pages: [makeRosterPage([rowA, rowB])],
      pageParams: [undefined],
    });
    let release: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    tickResponse = tickBody({
      deltas: { marks: [{ post_id: 2, curator: "riyat", state: "reviewed", updated_at: iso(0) }], flags: [], signals: [] },
    });
    router.on(/curation-desk\/tick/, async () => {
      await gate;
      return tickResponse;
    });

    const { rerender } = renderHook(
      ({ key }: { key: unknown[] }) =>
        useCurationTick({ username: "curator1", enabled: true, feedKey: key, rows: [rowA, rowB], getVisibleIds: () => [1, 2] }),
      { wrapper, initialProps: { key: feedKey as unknown[] } }
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    // The tick is in flight for the queue the viewer is about to leave.
    rerender({ key: otherKey });
    await act(async () => {
      release?.();
      await vi.advanceTimersByTimeAsync(10);
    });

    const left = queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(feedKey)!;
    const arrived = queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(otherKey)!;
    expect(arrived.pages[0].items[1].overlay).toBeNull();
    expect(left.pages[0].items[1].overlay).toBeNull();

    // The delta window of the queue that left is not the new queue's window.
    router.reset();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(router.callsTo(/tick/)[0].body?.since).toBeNull();
  });

  it("discards an answer that arrives after the desk unmounted", async () => {
    seed();
    let release: (() => void) | null = null;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    tickResponse = tickBody({
      deltas: { marks: [{ post_id: 2, curator: "riyat", state: "reviewed", updated_at: iso(0) }], flags: [], signals: [] },
    });
    router.on(/curation-desk\/tick/, async () => {
      await gate;
      return tickResponse;
    });
    const setQueryData = vi.spyOn(queryClient, "setQueryData");

    const { unmount } = renderHook(
      () => useCurationTick({ username: "curator1", enabled: true, feedKey, rows: [rowA, rowB], getVisibleIds: () => [1, 2] }),
      { wrapper }
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    // The viewer leaves the desk with the tick still in flight.
    unmount();
    await act(async () => {
      release?.();
      await vi.advanceTimersByTimeAsync(10);
    });

    expect(setQueryData).not.toHaveBeenCalled();
    const after = queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(feedKey)!;
    expect(after.pages[0].items[1].overlay).toBeNull();
  });

  it("merges deltas keeping identity for untouched rows and invalidates on truncated", async () => {
    seed();
    const before = queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(feedKey)!;
    const untouched = before.pages[0].items[0];
    tickResponse = tickBody({
      deltas: {
        marks: [{ post_id: 2, curator: "riyat", state: "reviewed", updated_at: iso(0) }],
        flags: [],
        signals: [],
      },
    });
    renderHook(() => useCurationTick({ username: "curator1", enabled: true, feedKey, rows: [rowA, rowB], getVisibleIds: () => [1, 2] }), { wrapper });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    const after = queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(feedKey)!;
    expect(after.pages[0].items[1].overlay?.team_mark).toBe("reviewed");
    expect(after.pages[0].items[0]).toBe(untouched);

    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    tickResponse = tickBody({ truncated: true });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: feedKey });
  });
});

describe("mergeTickIntoPages", () => {
  it("returns the same data when the tick carries nothing", () => {
    const data: InfiniteData<CurationRosterFeedPage> = { pages: [makeRosterPage([makeRow({ post_id: 1 })])], pageParams: [undefined] };
    expect(mergeTickIntoPages(data, tickBody())).toBe(data);
  });

  /**
   * The desk used to shed a stale row by accident, by replacing every loaded
   * page whenever the head moved. It keeps the pages now, so a post the trail
   * curated while the curator was reading has to reach the row it is on.
   */
  it("applies a row delta, so a curated post stops rendering as open", () => {
    const open = makeRow({ post_id: 1, state: 0, voted_by: [], overlay: makeOverlay() });
    const untouched = makeRow({ post_id: 2, state: 0, overlay: makeOverlay() });
    const data: InfiniteData<CurationRosterFeedPage> = {
      pages: [makeRosterPage([open, untouched])],
      pageParams: [undefined],
    };

    const result = mergeTickIntoPages(
      data,
      tickBody({
        deltas: {
          marks: [],
          flags: [],
          signals: [],
          rows: [
            {
              post_id: 1,
              state: 1,
              trailed_by: null,
              voted_by: [{ voter: "ecency", weight: 560, at: iso(-1_000) }],
              unvoted_at: null,
            },
          ],
        },
      })
    )!;

    expect(result.pages[0].items[0].state).toBe(1);
    expect(result.pages[0].items[0].voted_by).toHaveLength(1);
    // The row keeps everything the delta did not name, and its overlay.
    expect(result.pages[0].items[0].title).toBe(open.title);
    expect(result.pages[0].items[0].overlay).toBeTruthy();
    // A row the delta did not name is the same object, so it does not re-render.
    expect(result.pages[0].items[1]).toBe(untouched);
  });

  /**
   * The next tick asks for a full overlay only for rows that still have none, so
   * inventing an empty one here would convince the client for good that this row's
   * marks, flags and signals had already been loaded.
   */
  it("does not invent an overlay for a row that only changed state", () => {
    const noOverlay = makeRow({ post_id: 1, state: 0 });
    delete (noOverlay as { overlay?: unknown }).overlay;
    const data: InfiniteData<CurationRosterFeedPage> = {
      pages: [makeRosterPage([noOverlay])],
      pageParams: [undefined],
    };

    const result = mergeTickIntoPages(
      data,
      tickBody({
        deltas: {
          marks: [],
          flags: [],
          signals: [],
          rows: [{ post_id: 1, state: 1, trailed_by: null, voted_by: [], unvoted_at: null }],
        },
      })
    )!;

    expect(result.pages[0].items[0].state).toBe(1);
    expect(result.pages[0].items[0].overlay).toBeUndefined();
  });

  /**
   * The route names every visible row, changed or not, so deciding what actually
   * moved is this side's job. Without it every visible row would be a new object
   * four times a minute and every memoized row would re-render.
   */
  it("keeps the row object when the description matches what it already holds", () => {
    const row = makeRow({ post_id: 1, state: 0, voted_by: [], overlay: makeOverlay() });
    const data: InfiniteData<CurationRosterFeedPage> = {
      pages: [makeRosterPage([row])],
      pageParams: [undefined],
    };

    const same = mergeTickIntoPages(
      data,
      tickBody({
        deltas: {
          marks: [],
          flags: [],
          signals: [],
          rows: [{ post_id: 1, state: 0, trailed_by: null, voted_by: [], unvoted_at: null }],
        },
      })
    )!;
    expect(same).toBe(data);

    // A vote that advances no timestamp on the server still lands here.
    const moved = mergeTickIntoPages(
      data,
      tickBody({
        deltas: {
          marks: [],
          flags: [],
          signals: [],
          rows: [
            {
              post_id: 1,
              state: 0,
              trailed_by: null,
              voted_by: [{ voter: "ecency", weight: 560, at: iso(-1_000) }],
              unvoted_at: null,
            },
          ],
        },
      })
    )!;
    expect(moved).not.toBe(data);
    expect(moved.pages[0].items[0].voted_by).toHaveLength(1);
  });

  /**
   * With curated posts hidden, a row the tick reports as curated leaves the
   * list now, rather than sitting there as a curated card until the next
   * refresh happens to drop it. With them shown, it turns into that card.
   */
  it("drops a row that just got curated when the queue hides curated posts", () => {
    const open = makeRow({ post_id: 1, state: 0, overlay: makeOverlay() });
    const other = makeRow({ post_id: 2, state: 0, overlay: makeOverlay() });
    const data: InfiniteData<CurationRosterFeedPage> = {
      pages: [makeRosterPage([open, other])],
      pageParams: [undefined],
    };
    const curated = tickBody({
      deltas: {
        marks: [],
        flags: [],
        signals: [],
        rows: [{ post_id: 1, state: 1, trailed_by: null, voted_by: [], unvoted_at: null }],
      },
    });

    const hidden = mergeTickIntoPages(data, curated, { feed: { hide_curated: true } })!;
    expect(hidden.pages[0].items.map((r) => r.post_id)).toEqual([2]);
    expect(hidden.pages[0].items[0]).toBe(other);

    const shown = mergeTickIntoPages(data, curated, { feed: { hide_curated: false } })!;
    expect(shown.pages[0].items.map((r) => r.post_id)).toEqual([1, 2]);
    expect(shown.pages[0].items[0].state).toBe(1);
  });

  it("drops a row a colleague reviewed or snoozed from a queue that hides those, and keeps a noted one", () => {
    const rows = [1, 2, 3, 4].map((id) => makeRow({ post_id: id, state: 0, overlay: makeOverlay() }));
    const data: InfiniteData<CurationRosterFeedPage> = { pages: [makeRosterPage(rows)], pageParams: [undefined] };
    const tick = tickBody({
      deltas: {
        marks: [
          { post_id: 1, curator: "riyat", state: "reviewed", updated_at: "2026-09-05T12:00:00" },
          { post_id: 2, curator: "riyat", state: "snoozed", snooze_until: "2026-09-06T12:00:00", updated_at: "2026-09-05T12:00:00" },
          { post_id: 3, curator: "riyat", state: "noted", has_note: true, updated_at: "2026-09-05T12:00:00" },
        ],
        flags: [],
        signals: [],
      },
    });

    // The desk's default: unreviewed only, snoozed hidden. A note is not a
    // team mark, so the noted row stays for the next curator to read.
    const now = Date.parse("2026-09-05T12:30:00Z");
    const hiding = mergeTickIntoPages(data, tick, { feed: {}, now })!;
    expect(hiding.pages[0].items.map((r) => r.post_id)).toEqual([3, 4]);
    expect(hiding.pages[0].items[0].overlay?.notes_count).toBe(1);
    expect(hiding.pages[0].items[1]).toBe(rows[3]);

    // Showing every mark: the rows stay and carry their badges.
    const showing = mergeTickIntoPages(data, tick, { feed: { hide_reviewed: false, hide_snoozed: false }, now })!;
    expect(showing.pages[0].items.map((r) => r.post_id)).toEqual([1, 2, 3, 4]);
    expect(showing.pages[0].items[0].overlay?.team_mark).toBe("reviewed");
    expect(showing.pages[0].items[1].overlay?.team_mark).toBe("snoozed");

    // No feed named: nothing leaves.
    const unjudged = mergeTickIntoPages(data, tick, { now })!;
    expect(unjudged.pages[0].items.map((r) => r.post_id)).toEqual([1, 2, 3, 4]);
  });

  it("does not count a snooze that ran out: a note on a resurfaced row leaves it listed", () => {
    // The minute job cleared the team level, but the expired mark is still
    // delivered with the row. A colleague's note must not snooze it again.
    const expired = { curator: "riyat", state: "snoozed" as const, snooze_until: "2026-09-05T11:00:00", updated_at: "2026-09-04T11:00:00" };
    const row = makeRow({ post_id: 7, state: 0, overlay: makeOverlay({ marks: [expired], team_mark: null, resurfaced_at: "2026-09-05T11:00:05" }) });
    const data: InfiniteData<CurationRosterFeedPage> = { pages: [makeRosterPage([row])], pageParams: [undefined] };
    const tick = tickBody({
      deltas: { marks: [{ post_id: 7, curator: "cur2", state: "noted", has_note: true, updated_at: "2026-09-05T12:00:00" }], flags: [], signals: [] },
    });
    const merged = mergeTickIntoPages(data, tick, { feed: {}, now: Date.parse("2026-09-05T12:30:00Z") })!;
    expect(merged.pages[0].items.map((r) => r.post_id)).toEqual([7]);
    expect(merged.pages[0].items[0].overlay?.team_mark).toBeNull();
    // Still inside its snooze: the same note keeps it snoozed and out.
    const early = mergeTickIntoPages(data, tick, { feed: {}, now: Date.parse("2026-09-05T10:00:00Z") })!;
    expect(early.pages[0].items).toEqual([]);
  });

  it("judges a flag, an exclusion and the flagged lens by the same rule", () => {
    const rows = [1, 2, 3].map((id) => makeRow({ post_id: id, state: 0, overlay: makeOverlay() }));
    const data: InfiniteData<CurationRosterFeedPage> = { pages: [makeRosterPage(rows)], pageParams: [undefined] };
    const now = Date.parse("2026-09-05T12:30:00Z");
    // A flag is a team mark: the default queue (unhandled only) lets it go.
    const flagged = tickBody({ deltas: { marks: [{ post_id: 1, curator: "riyat", state: "flagged", updated_at: "2026-09-05T12:00:00" }], flags: [], signals: [] } });
    expect(mergeTickIntoPages(data, flagged, { feed: {}, now })!.pages[0].items.map((r) => r.post_id)).toEqual([2, 3]);
    // A row a mod excluded leaves every lens but the excluded one.
    const excluded = tickBody({ deltas: { marks: [], flags: [{ post_id: 2, flags: { abuser: true }, excluded_reason: "abuser" }], signals: [] } });
    expect(mergeTickIntoPages(data, excluded, { feed: {}, now })!.pages[0].items.map((r) => r.post_id)).toEqual([1, 3]);
    // On the flagged lens a review takes the flag's place, so the row leaves that lens.
    const lens = [makeRow({ post_id: 9, state: 0, overlay: makeOverlay({ team_mark: "flagged", team_mark_by: "riyat", marks: [{ curator: "riyat", state: "flagged", updated_at: "2026-09-05T11:00:00" }] }) })];
    const lensData: InfiniteData<CurationRosterFeedPage> = { pages: [makeRosterPage(lens)], pageParams: [undefined] };
    const reviewed = tickBody({ deltas: { marks: [{ post_id: 9, curator: "cur2", state: "reviewed", updated_at: "2026-09-05T12:00:00" }], flags: [], signals: [] } });
    expect(mergeTickIntoPages(lensData, reviewed, { feed: { flagged: "1" }, now })!.pages[0].items).toEqual([]);
  });

  it("is unchanged by a backend that sends no row deltas", () => {
    const data: InfiniteData<CurationRosterFeedPage> = {
      pages: [makeRosterPage([makeRow({ post_id: 1, state: 0 })])],
      pageParams: [undefined],
    };
    expect(mergeTickIntoPages(data, tickBody({ deltas: { marks: [], flags: [], signals: [] } }))).toBe(data);
  });

  it("keeps a colleague's note body when a note-less delta updates their mark", () => {
    const withNote = makeRow({
      post_id: 1,
      overlay: makeOverlay({
        marks: [
          { curator: "riyat", state: "noted", note: "checked the sources", has_note: true, updated_at: iso(-60_000) },
        ],
        notes_count: 1,
      }),
    });
    const data: InfiniteData<CurationRosterFeedPage> = {
      pages: [makeRosterPage([withNote])],
      pageParams: [undefined],
    };
    const result = mergeTickIntoPages(
      data,
      tickBody({
        deltas: {
          // The delta carries has_note, never the body.
          marks: [{ post_id: 1, curator: "riyat", state: "flagged", reason: "ai_slop", has_note: true, updated_at: iso(0) }],
          flags: [],
          signals: [],
        },
      })
    )!;
    const [mark] = result.pages[0].items[0].overlay!.marks;
    expect(mark.state).toBe("flagged");
    expect(mark.note).toBe("checked the sources");
    expect(result.pages[0].items[0].overlay!.notes_count).toBe(1);
  });

  it("counts notes from has_note, not from the body the delta omitted", () => {
    const data: InfiniteData<CurationRosterFeedPage> = {
      pages: [makeRosterPage([makeRow({ post_id: 1, overlay: makeOverlay() })])],
      pageParams: [undefined],
    };
    const result = mergeTickIntoPages(
      data,
      tickBody({
        deltas: {
          marks: [
            { post_id: 1, curator: "riyat", state: "flagged", has_note: true, updated_at: iso(0) },
            { post_id: 1, curator: "seckorama", state: "reviewed", has_note: false, updated_at: iso(0) },
          ],
          flags: [],
          signals: [],
        },
      })
    )!;
    expect(result.pages[0].items[0].overlay!.notes_count).toBe(1);
  });

  it("fills a missing overlay from `overlay` and applies flags and signals deltas", () => {
    const data: InfiniteData<CurationRosterFeedPage> = {
      pages: [makeRosterPage([makeRow({ post_id: 1, overlay: null }), makeRow({ post_id: 2, overlay: makeOverlay() })])],
      pageParams: [undefined],
    };
    const result = mergeTickIntoPages(
      data,
      tickBody({
        overlay: [{ post_id: 1, ...makeOverlay({ notes_count: 2 }) }],
        deltas: {
          marks: [],
          flags: [{ post_id: 2, flags: { spaminator: true }, excluded_reason: null }],
          signals: [{ post_id: 2, signals: { formulaic: 71 } }],
        },
      })
    )!;
    expect(result.pages[0].items[0].overlay?.notes_count).toBe(2);
    expect(result.pages[0].items[1].overlay?.flags.spaminator).toBe(true);
    expect(result.pages[0].items[1].overlay?.signals?.formulaic).toBe(71);
  });
});
