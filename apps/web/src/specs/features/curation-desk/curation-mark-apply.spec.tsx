import React from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, type InfiniteData } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurationRosterFeedPage } from "@ecency/sdk";
import { installFetchRouter, makeOverlay, makeRosterPage, makeRow } from "./curation-test-utils";

vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
}));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/utils")),
  ensureValidToken: vi.fn(async () => "code-1"),
}));
vi.mock("@/core/hooks/use-active-username", () => ({ useActiveUsername: () => "curator1" }));

import {
  noteCuratorActivity,
  resetRowMutations,
  rosterFeedQueryOptions,
  useClearMark,
  useCurationMark,
  useCurationTick,
} from "@/features/curation-desk/hooks";

/**
 * A mark answers with the marked row, and every loaded roster feed judges that
 * row by its own filters: the unreviewed-only queue lets it go, the queue
 * showing every mark keeps it with its badge. An undo brings it back where
 * it was.
 */
describe("a mark applied to the loaded roster feeds", () => {
  const hiding = rosterFeedQueryOptions("curator1", { sort: "queue", hide_reviewed: true, hide_snoozed: true }).queryKey;
  const showing = rosterFeedQueryOptions("curator1", { sort: "queue", hide_reviewed: false, hide_snoozed: false }).queryKey;
  let router: ReturnType<typeof installFetchRouter>;
  let queryClient: QueryClient;

  const rows = () => [1, 2, 3].map((id) => makeRow({ post_id: id, author: `author${id}`, permlink: `post-${id}`, overlay: makeOverlay() }));

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  function ids(key: readonly unknown[]) {
    return queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(key)!.pages[0].items.map((r) => r.post_id);
  }

  function marked(id: number, mark: "reviewed" | "snoozed" | "flagged" | "noted" | null) {
    const row = makeRow({ post_id: id, author: `author${id}`, permlink: `post-${id}` });
    const team = mark === "noted" ? null : mark;
    return {
      mark: mark ? { curator: "curator1", state: mark, updated_at: "2026-09-05T12:00:00" } : null,
      row: { ...row, overlay: makeOverlay({ team_mark: team, team_mark_by: team ? "curator1" : null, notes_count: mark === "noted" ? 1 : 0 }) },
    };
  }

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    for (const key of [hiding, showing]) {
      queryClient.setQueryData<InfiniteData<CurationRosterFeedPage>>(key, { pages: [makeRosterPage(rows())], pageParams: [undefined] });
    }
    router = installFetchRouter();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetRowMutations();
  });

  it("takes a reviewed row out of the feed hiding reviewed rows and keeps it, badged, in the one showing them", async () => {
    router.on(/curation-desk\/mark$/, () => marked(2, "reviewed"));
    const { result } = renderHook(() => useCurationMark(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ row: rows()[1], state: "reviewed" });
    });
    expect(ids(hiding)).toEqual([1, 3]);
    expect(ids(showing)).toEqual([1, 2, 3]);
    const kept = queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(showing)!.pages[0].items[1];
    expect(kept.overlay?.team_mark).toBe("reviewed");
  });

  it("keeps a noted row in every feed, with its note counted, since a note is not a team mark", async () => {
    router.on(/curation-desk\/mark$/, () => marked(2, "noted"));
    const { result } = renderHook(() => useCurationMark(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ row: rows()[1], state: "noted", note: "read the second half" });
    });
    expect(ids(hiding)).toEqual([1, 2, 3]);
    expect(queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(hiding)!.pages[0].items[1].overlay?.notes_count).toBe(1);
  });

  it("takes a snoozed row out of the default feed too", async () => {
    router.on(/curation-desk\/mark$/, () => marked(3, "snoozed"));
    const { result } = renderHook(() => useCurationMark(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ row: rows()[2], state: "snoozed", snooze_until: "2026-09-06T12:00:00" });
    });
    expect(ids(hiding)).toEqual([1, 2]);
    expect(ids(showing)).toEqual([1, 2, 3]);
  });

  it("puts an undone row back where it was, in the feed it left", async () => {
    router.on(/curation-desk\/mark$/, () => marked(2, "reviewed"));
    router.on(/curation-desk\/mark-clear$/, () => marked(2, null));
    const mark = renderHook(() => useCurationMark(), { wrapper });
    const clear = renderHook(() => useClearMark(), { wrapper });
    await act(async () => {
      await mark.result.current.mutateAsync({ row: rows()[1], state: "reviewed" });
    });
    expect(ids(hiding)).toEqual([1, 3]);

    await act(async () => {
      await clear.result.current.mutateAsync({ author: "author2", permlink: "post-2", restoreAt: { key: hiding, page: 0, index: 1 } });
    });
    await waitFor(() => expect(ids(hiding)).toEqual([1, 2, 3]));
    expect(queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(hiding)!.pages[0].items[1].overlay?.team_mark).toBeNull();
    // The other feed never lost the row; the cleared mark just updates it there.
    expect(ids(showing)).toEqual([1, 2, 3]);
  });

  it("clamps a stale restore position to the page instead of throwing", async () => {
    router.on(/curation-desk\/mark-clear$/, () => marked(2, null));
    queryClient.setQueryData<InfiniteData<CurationRosterFeedPage>>(hiding, { pages: [makeRosterPage([rows()[0]])], pageParams: [undefined] });
    const clear = renderHook(() => useClearMark(), { wrapper });
    await act(async () => {
      await clear.result.current.mutateAsync({ author: "author2", permlink: "post-2", restoreAt: { key: hiding, page: 4, index: 9 } });
    });
    expect(ids(hiding)).toEqual([1, 2]);
  });
});

describe("roster feed paging after rows left a page live", () => {
  it("asks for the next page while the route says more remain, whatever the page's row count", () => {
    const { getNextPageParam } = rosterFeedQueryOptions("curator1", { sort: "queue" });
    const short = makeRosterPage([makeRow({ post_id: 1, _cursor: "s:1" })]);
    expect(getNextPageParam({ ...short, next_cursor: "s:25" })).toBe("s:1");
    expect(getNextPageParam({ ...short, next_cursor: null })).toBeUndefined();
    // Every row of the last page left: the route's own cursor carries on.
    expect(getNextPageParam({ ...makeRosterPage([]), next_cursor: "s:25" })).toBe("s:25");
  });
});

describe("an undone mark and what happened meanwhile", () => {
  const hiding = rosterFeedQueryOptions("curator1", { sort: "queue", hide_reviewed: true, hide_snoozed: true }).queryKey;
  const random = rosterFeedQueryOptions("curator1", { sort: "random", seed: "abcd1234" }).queryKey;
  let router: ReturnType<typeof installFetchRouter>;
  let queryClient: QueryClient;

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  const at = (n: number) => `2026-09-05T${String(n).padStart(2, "0")}:00:00`;
  const row = (id: number, hour: number, mark: "reviewed" | null = null) =>
    makeRow({ post_id: id, author: `author${id}`, permlink: `post-${id}`, created: at(hour), overlay: makeOverlay({ team_mark: mark, team_mark_by: mark ? "riyat" : null }) });
  const ids = (key: readonly unknown[]) =>
    queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(key)!.pages.map((p) => p.items.map((r) => r.post_id));

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    router = installFetchRouter();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    resetRowMutations();
  });

  it("puts the row back in its PLACE under the queue order, across pages, whatever left meanwhile", async () => {
    // Two pages, oldest first. Row 13 (10:00) was captured at page 1 index 1,
    // then row 11 left, so that index now names the wrong slot.
    queryClient.setQueryData<InfiniteData<CurationRosterFeedPage>>(hiding, {
      pages: [makeRosterPage([row(12, 9), row(14, 11)]), makeRosterPage([row(15, 12), row(16, 13)])],
      pageParams: [undefined, "c14"],
    });
    router.on(/curation-desk\/mark-clear$/, () => ({ mark: null, row: row(13, 10) }));
    const clear = renderHook(() => useClearMark(), { wrapper });
    await act(async () => {
      await clear.result.current.mutateAsync({ author: "author13", permlink: "post-13", restoreAt: { key: hiding, sort: "queue", page: 0, index: 1 } });
    });
    expect(ids(hiding)).toEqual([[12, 13, 14], [15, 16]]);

    // A row older than everything loaded on page two goes onto page two.
    router.on(/curation-desk\/mark-clear$/, () => ({ mark: null, row: row(17, 12) }));
    await act(async () => {
      await clear.result.current.mutateAsync({ author: "author17", permlink: "post-17", restoreAt: { key: hiding, sort: "queue", page: 0, index: 0 } });
    });
    expect(ids(hiding)).toEqual([[12, 13, 14], [15, 17, 16]]);
  });

  it("falls back to the captured slot under an order it cannot compute", async () => {
    queryClient.setQueryData<InfiniteData<CurationRosterFeedPage>>(random, {
      pages: [makeRosterPage([row(12, 9), row(14, 11)]), makeRosterPage([row(15, 12)])],
      pageParams: [undefined, "c14"],
    });
    router.on(/curation-desk\/mark-clear$/, () => ({ mark: null, row: row(13, 10) }));
    const clear = renderHook(() => useClearMark(), { wrapper });
    await act(async () => {
      await clear.result.current.mutateAsync({ author: "author13", permlink: "post-13", restoreAt: { key: random, sort: "random", page: 1, index: 0 } });
    });
    expect(ids(random)).toEqual([[12, 14], [13, 15]]);
  });

  it("does not bring a row back when a colleague's reviewed mark still stands after the clear", async () => {
    queryClient.setQueryData<InfiniteData<CurationRosterFeedPage>>(hiding, { pages: [makeRosterPage([row(12, 9), row(14, 11)])], pageParams: [undefined] });
    // The clear removed this curator's mark; the team mark is now riyat's review.
    router.on(/curation-desk\/mark-clear$/, () => ({ mark: null, row: row(13, 10, "reviewed") }));
    const clear = renderHook(() => useClearMark(), { wrapper });
    await act(async () => {
      await clear.result.current.mutateAsync({ author: "author13", permlink: "post-13", restoreAt: { key: hiding, sort: "queue", page: 0, index: 1 } });
    });
    expect(ids(hiding)).toEqual([[12, 14]]);
  });

  it("drops another cached feed that let the row go and cannot put it back, so it is fetched afresh when shown", async () => {
    const other = rosterFeedQueryOptions("curator1", { sort: "queue", window: "12h" }).queryKey;
    for (const key of [hiding, other]) {
      queryClient.setQueryData<InfiniteData<CurationRosterFeedPage>>(key, { pages: [makeRosterPage([row(12, 9), row(13, 10)])], pageParams: [undefined] });
    }
    router.on(/curation-desk\/mark$/, () => ({ mark: null, row: row(13, 10, "reviewed") }));
    router.on(/curation-desk\/mark-clear$/, () => ({ mark: null, row: row(13, 10) }));
    const mark = renderHook(() => useCurationMark(), { wrapper });
    const clear = renderHook(() => useClearMark(), { wrapper });
    await act(async () => {
      await mark.result.current.mutateAsync({ row: row(13, 10), state: "reviewed" });
    });
    expect(ids(hiding)).toEqual([[12]]);
    expect(ids(other)).toEqual([[12]]);
    await act(async () => {
      await clear.result.current.mutateAsync({ author: "author13", permlink: "post-13", restoreAt: { key: hiding, sort: "queue", page: 0, index: 1 } });
    });
    expect(ids(hiding)).toEqual([[12, 13]]);
    expect(queryClient.getQueryData(other)).toBeUndefined();
  });

  it("ignores a tick that left before the mark and answered after the undo, so the restored row stays", async () => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    noteCuratorActivity();
    const rows = [row(11, 8), row(12, 9), row(13, 10)];
    queryClient.setQueryData<InfiniteData<CurationRosterFeedPage>>(hiding, { pages: [makeRosterPage(rows)], pageParams: [undefined] });
    let answer: (value: unknown) => void = () => undefined;
    router.on(/curation-desk\/tick/, () => new Promise((resolve) => (answer = resolve)));
    router.on(/curation-desk\/mark$/, () => ({ mark: null, row: row(12, 9, "reviewed") }));
    router.on(/curation-desk\/mark-clear$/, () => ({ mark: null, row: row(12, 9) }));
    renderHook(() => useCurationTick({ username: "curator1", enabled: true, feedKey: hiding, rows, getVisibleIds: () => [11, 12, 13], feed: { sort: "queue" } }), { wrapper });
    const mark = renderHook(() => useCurationMark(), { wrapper });
    const clear = renderHook(() => useClearMark(), { wrapper });

    // The tick goes out, then the mark and its undo both land.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(15_000);
    });
    expect(router.callsTo(/curation-desk\/tick/)).toHaveLength(1);
    await act(async () => {
      await mark.result.current.mutateAsync({ row: rows[1], state: "reviewed" });
    });
    expect(ids(hiding)).toEqual([[11, 13]]);
    await act(async () => {
      await clear.result.current.mutateAsync({ author: "author12", permlink: "post-12", restoreAt: { key: hiding, sort: "queue", page: 0, index: 1 } });
    });
    expect(ids(hiding)).toEqual([[11, 12, 13]]);

    // The old tick answers with the mark it read in between: row 12 reviewed.
    await act(async () => {
      answer({
        overlay: [],
        deltas: { marks: [{ post_id: 12, curator: "curator1", state: "reviewed", updated_at: "2026-09-05T12:00:05" }], flags: [], signals: [], rows: [] },
        team_cursor: { post_id: null, created: null },
        active_curators: [],
        trail_alerts: [],
        generated_at: "2026-09-05T12:00:06Z",
        truncated: false,
      });
      await Promise.resolve();
    });
    expect(ids(hiding)).toEqual([[11, 12, 13]]);
    expect(queryClient.getQueryData<InfiniteData<CurationRosterFeedPage>>(hiding)!.pages[0].items[1].overlay?.team_mark).toBeNull();
  });
});
