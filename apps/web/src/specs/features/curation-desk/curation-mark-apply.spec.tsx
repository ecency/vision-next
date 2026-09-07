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

import { rosterFeedQueryOptions, useClearMark, useCurationMark } from "@/features/curation-desk/hooks";

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
