import React from "react";
import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider, type InfiniteData } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CurationFeedPage, CurationRosterFeedPage } from "@ecency/sdk";
import { installFetchRouter, makeFeedPage, makeOverlay, makeRosterPage, makeRow, makeStatus } from "./curation-test-utils";

/** The poll reads both feeds through the same key, so the specs do too. */
type AnyFeedPage = CurationFeedPage | CurationRosterFeedPage;

vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk")),
}));
vi.mock("@/utils", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@/utils")),
  ensureValidToken: vi.fn(async () => "code-1"),
}));
vi.mock("@/core/hooks/use-active-username", () => ({ useActiveUsername: () => "member1" }));

import { noteRowMutation, resetRowMutations, useStatusPoll } from "@/features/curation-desk/hooks";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Drains the await chain of one poll: status, then page one, then the install. */
async function flush(rounds = 12) {
  for (let i = 0; i < rounds; i++) {
    await act(async () => {
      await Promise.resolve();
    });
  }
}

async function poll() {
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await flush();
}

/**
 * The public head refresh. Every case here is a queue that already sits in the
 * cache: the poll decides whether to replace it, never what it contains.
 */
describe("useStatusPoll", () => {
  const feedKey = ["curation", "feed", { sort: "newest" }];
  const otherFeedKey = ["curation", "feed", { sort: "queue" }];
  let router: ReturnType<typeof installFetchRouter>;
  let queryClient: QueryClient;
  let statusBody = makeStatus();

  function wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  function seed(key: unknown[], pages: AnyFeedPage[]) {
    queryClient.setQueryData<InfiniteData<AnyFeedPage>>(key, {
      pages,
      pageParams: pages.map((_, index) => (index === 0 ? undefined : `c${index}`)),
    });
  }

  function loaded(key: unknown[]) {
    return queryClient.getQueryData<InfiniteData<AnyFeedPage>>(key)!;
  }

  beforeEach(() => {
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    statusBody = makeStatus();
    router = installFetchRouter().on(/curation-desk\/status/, () => statusBody);
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    resetRowMutations();
  });

  it("never lets a head read before a mark bring the marked row back, or overwrite it", async () => {
    // Page one: 4 and 3. While the head refresh is out, the curator marks 4
    // reviewed (it leaves the loaded pages) and notes 3 (its loaded copy is
    // the mark's answer). The refresh was read before either write.
    seed(feedKey, [makeRosterPage([makeRow({ post_id: 4 }), makeRow({ post_id: 3, overlay: makeOverlay() })])]);
    statusBody = makeStatus({ latest_post_id: 9 });
    let release: (page: AnyFeedPage) => void = () => undefined;
    const fetchPageOne = vi.fn(
      () =>
        new Promise<AnyFeedPage>((resolve) => {
          release = resolve;
        })
    );
    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, sort: "queue" }), { wrapper });
    await poll();
    expect(fetchPageOne).toHaveBeenCalledTimes(1);

    // The marks land while the page is in flight.
    const noted = makeRow({ post_id: 3, overlay: makeOverlay({ notes_count: 1 }) });
    queryClient.setQueryData<InfiniteData<AnyFeedPage>>(feedKey, { pages: [makeRosterPage([noted])], pageParams: [undefined] });
    noteRowMutation(4);
    noteRowMutation(3);

    await act(async () => {
      release(makeRosterPage([makeRow({ post_id: 9 }), makeRow({ post_id: 4 }), makeRow({ post_id: 3, overlay: makeOverlay() })]));
    });
    await flush();
    const items = loaded(feedKey).pages[0].items;
    expect(items.map((r) => r.post_id).sort()).toEqual([3, 9]);
    expect((items.find((r) => r.post_id === 3) as CurationRosterFeedPage["items"][number] | undefined)?.overlay?.notes_count).toBe(1);
  });

  it("takes the baseline from the loaded page, so a head that moved before the first poll refreshes", async () => {
    seed(feedKey, [makeFeedPage([makeRow({ post_id: 1 })], { feed_version: "v1" })]);
    // The head moved between the page load and this first poll.
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 9 });
    const fetchPageOne = vi.fn(async () => makeFeedPage([makeRow({ post_id: 9 })], { feed_version: "v2" }));

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();

    expect(fetchPageOne).toHaveBeenCalledTimes(1);
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(9);
  });

  // A roster page carries no feed_version, so the version path has nothing to
  // compare and the head id is the only signal the poll gets.
  it("refreshes a roster page one that the status head has passed, then records the baseline", async () => {
    seed(feedKey, [makeRosterPage([makeRow({ post_id: 4 }), makeRow({ post_id: 3 })])]);
    // The post arrived between the feed request and this first poll.
    statusBody = makeStatus({ latest_post_id: 9 });
    const fetchPageOne = vi.fn(async () => makeRosterPage([makeRow({ post_id: 9 }), makeRow({ post_id: 4 })]));

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, sort: "newest" }), { wrapper });
    await poll();

    expect(fetchPageOne).toHaveBeenCalledTimes(1);
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(9);

    // The baseline landed with the page, so the same head is no longer a change.
    await poll();
    expect(fetchPageOne).toHaveBeenCalledTimes(1);
  });

  it("treats a head against an empty page one as an initial refresh, then records the baseline", async () => {
    // A desk that opened empty has no row to compare against; the first status
    // with a head must fetch page one or the page stays empty until the global
    // head moves again.
    seed(feedKey, [makeRosterPage([])]);
    statusBody = makeStatus({ latest_post_id: 9 });
    const fetchPageOne = vi.fn(async () => makeRosterPage([makeRow({ post_id: 9 })]));

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, sort: "newest" }), { wrapper });
    await poll();

    expect(fetchPageOne).toHaveBeenCalledTimes(1);
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(9);

    await poll();
    expect(fetchPageOne).toHaveBeenCalledTimes(1);
  });

  it("keeps an empty page one at rest while the status carries no head", async () => {
    seed(feedKey, [makeRosterPage([])]);
    statusBody = makeStatus({ latest_post_id: null });
    const fetchPageOne = vi.fn(async () => makeRosterPage([]));

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, sort: "newest" }), { wrapper });
    await poll();
    await poll();

    expect(fetchPageOne).not.toHaveBeenCalled();
  });

  it("leaves a roster page one alone while the status head matches its newest row", async () => {
    seed(feedKey, [makeRosterPage([makeRow({ post_id: 9 }), makeRow({ post_id: 4 })])]);
    statusBody = makeStatus({ latest_post_id: 9 });
    const fetchPageOne = vi.fn(async () => makeRosterPage([makeRow({ post_id: 9 })]));

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, sort: "newest" }), { wrapper });
    await poll();
    await poll();

    expect(fetchPageOne).not.toHaveBeenCalled();
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(9);
  });

  it("does not refresh while the loaded page's version still stands", async () => {
    seed(feedKey, [makeFeedPage([makeRow({ post_id: 1 })], { feed_version: "v1" })]);
    const fetchPageOne = vi.fn(async () => makeFeedPage([makeRow({ post_id: 9 })]));

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();
    await poll();

    expect(fetchPageOne).not.toHaveBeenCalled();
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(1);
  });

  it("keeps the version when the refresh fails, so the next poll asks for the same change again", async () => {
    seed(feedKey, [makeFeedPage([makeRow({ post_id: 1 })], { feed_version: "v1" })]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 9 });
    let attempts = 0;
    const fetchPageOne = vi.fn(async () => {
      attempts += 1;
      if (attempts === 1) throw new Error("gateway hiccup");
      return makeFeedPage([makeRow({ post_id: 9 })], { feed_version: "v2" });
    });

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();
    expect(fetchPageOne).toHaveBeenCalledTimes(1);
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(1);

    // The version was never consumed by the failure: the same status answer
    // still reads as a change.
    await poll();
    expect(fetchPageOne).toHaveBeenCalledTimes(2);
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(9);
  });

  it("re-applies a change first seen while nothing was loaded under the key", async () => {
    // The poll runs on an empty view too, so the first change it reads often
    // arrives before page one does.
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 9 });
    const fetchPageOne = vi.fn(async () => makeFeedPage([makeRow({ post_id: 9 })], { feed_version: "v2" }));

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();
    expect(fetchPageOne).not.toHaveBeenCalled();

    // Page one lands, built on the head the request carried.
    seed(feedKey, [makeFeedPage([makeRow({ post_id: 1 })], { feed_version: "v1" })]);
    await poll();

    expect(fetchPageOne).toHaveBeenCalledTimes(1);
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(9);
  });

  it("leaves the change alone while page one is still in flight", async () => {
    seed(feedKey, [makeFeedPage([makeRow({ post_id: 1 })], { feed_version: "v1" })]);
    const inFlight = deferred<InfiniteData<CurationFeedPage>>();
    void queryClient
      .fetchQuery({ queryKey: feedKey, queryFn: () => inFlight.promise, staleTime: 0 })
      .catch(() => undefined);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 9 });
    const fetchPageOne = vi.fn(async () => makeFeedPage([makeRow({ post_id: 9 })], { feed_version: "v2" }));

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();
    // That request was sent under the older head, so its answer would put the
    // change back the moment it installs.
    expect(fetchPageOne).not.toHaveBeenCalled();

    await act(async () => {
      inFlight.resolve({
        pages: [makeFeedPage([makeRow({ post_id: 1 })], { feed_version: "v1" })],
        pageParams: [undefined],
      });
    });
    await flush();
    await poll();

    expect(fetchPageOne).toHaveBeenCalledTimes(1);
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(9);
  });

  /**
   * Replacing the loaded pages is what threw a curator's place away: the item
   * array falls from N*25 back to 25 and the virtual list collapses to the
   * top. The refreshed head is merged in instead, and every later page stays.
   */
  it("merges the refreshed head into page one and keeps the loaded pages", async () => {
    seed(feedKey, [
      makeFeedPage([makeRow({ post_id: 100 }), makeRow({ post_id: 76 })], { feed_version: "v1" }),
      makeFeedPage([makeRow({ post_id: 75 }), makeRow({ post_id: 51 })], { feed_version: "v1" }),
    ]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 105 });
    const fetchPageOne = vi.fn(async () =>
      makeFeedPage([makeRow({ post_id: 105 }), makeRow({ post_id: 100 })], { feed_version: "v2" })
    );

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();

    const data = loaded(feedKey);
    expect(data.pages).toHaveLength(2);
    expect(data.pageParams).toHaveLength(2);
    // 105 arrived, 100 came back from the server, and 76 is below the
    // refreshed window so it stays where page two continues from.
    expect(data.pages[0].items.map((r) => r.post_id)).toEqual([105, 100, 76]);
    expect(data.pages[1].items.map((r) => r.post_id)).toEqual([75, 51]);
  });

  it("drops a row the refreshed window no longer carries, and keeps the ones below it", async () => {
    seed(feedKey, [
      makeFeedPage([makeRow({ post_id: 100 }), makeRow({ post_id: 90 }), makeRow({ post_id: 76 })], { feed_version: "v1" }),
      makeFeedPage([makeRow({ post_id: 75 })], { feed_version: "v1" }),
    ]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 105 });
    // 90 was curated, so the server stopped serving it. Inside the refreshed
    // window the server is the truth; 76 sits below it and is kept.
    const fetchPageOne = vi.fn(async () =>
      makeFeedPage([makeRow({ post_id: 105 }), makeRow({ post_id: 100 }), makeRow({ post_id: 80 })], {
        feed_version: "v2",
      })
    );

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();

    const data = loaded(feedKey);
    expect(data.pages[0].items.map((r) => r.post_id)).toEqual([105, 100, 80, 76]);
    expect(data.pages).toHaveLength(2);
  });

  it("replaces rather than splices when more than a page arrived in between", async () => {
    seed(feedKey, [
      makeFeedPage([makeRow({ post_id: 100 }), makeRow({ post_id: 76 })], { feed_version: "v1" }),
      makeFeedPage([makeRow({ post_id: 75 }), makeRow({ post_id: 51 })], { feed_version: "v1" }),
    ]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 200 });
    // Nothing in common with the loaded page one: 101 to 199 are unaccounted
    // for, so merging the two runs would silently swallow them.
    const fetchPageOne = vi.fn(async () =>
      makeFeedPage([makeRow({ post_id: 200 }), makeRow({ post_id: 150 })], { feed_version: "v2" })
    );

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();

    const data = loaded(feedKey);
    expect(data.pages).toHaveLength(1);
    expect(data.pageParams).toEqual([undefined]);
    expect(data.pages[0].items.map((r) => r.post_id)).toEqual([200, 150]);
  });

  /**
   * An empty page one is a successful answer, not a no-op. Under keyset paging the
   * later pages start after it, so an empty head means an empty queue: keeping the
   * loaded rows would leave posts on screen that the server no longer serves.
   */
  it("clears the queue when the refreshed page comes back empty", async () => {
    seed(feedKey, [
      makeFeedPage([makeRow({ post_id: 100 }), makeRow({ post_id: 76 })], { feed_version: "v1" }),
      makeFeedPage([makeRow({ post_id: 75 })], { feed_version: "v1" }),
    ]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 105 });
    const fetchPageOne = vi.fn(async () => makeFeedPage([], { feed_version: "v2" }));

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();

    const data = loaded(feedKey);
    expect(data.pages).toHaveLength(1);
    expect(data.pages[0].items).toEqual([]);
    expect(data.pageParams).toEqual([undefined]);
  });

  /**
   * When enough of page one leaves, the fixed-size refresh reaches into page two.
   * A row inside that window which the server no longer carries must go from THERE
   * too, not only from page one.
   */
  it("drops a departed row from a later page when the window reaches into it", async () => {
    seed(feedKey, [
      makeFeedPage([makeRow({ post_id: 100 }), makeRow({ post_id: 90 })], { feed_version: "v1" }),
      makeFeedPage([makeRow({ post_id: 80 }), makeRow({ post_id: 70 })], { feed_version: "v1" }),
    ]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 105 });
    // 90 and 80 were curated; the refreshed window now spans 105 down to 75.
    const fetchPageOne = vi.fn(async () =>
      makeFeedPage([makeRow({ post_id: 105 }), makeRow({ post_id: 100 }), makeRow({ post_id: 75 })], {
        feed_version: "v2",
      })
    );

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();

    const data = loaded(feedKey);
    expect(data.pages[0].items.map((r) => r.post_id)).toEqual([105, 100, 75]);
    // 80 was inside the window and the server dropped it; 70 sits below and stays.
    expect(data.pages[1].items.map((r) => r.post_id)).toEqual([70]);
  });

  /**
   * Page one always starts at the head, so a loaded row on the head side of the
   * refreshed page would have come back if it were still in the queue. Its absence
   * proves it left, and keeping it would render a curated row as open.
   */
  it("drops a departed row above the refreshed head, not only inside it", async () => {
    seed(feedKey, [
      makeFeedPage([makeRow({ post_id: 105 }), makeRow({ post_id: 100 }), makeRow({ post_id: 90 })], {
        feed_version: "v1",
      }),
    ]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 100 });
    // 105 was curated, so the head is 100 now and the refresh never mentions 105.
    const fetchPageOne = vi.fn(async () =>
      makeFeedPage([makeRow({ post_id: 100 }), makeRow({ post_id: 90 }), makeRow({ post_id: 80 })], {
        feed_version: "v2",
      })
    );

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();

    expect(loaded(feedKey).pages[0].items.map((r) => r.post_id)).toEqual([100, 90, 80]);
  });

  it("carries the sort captured at the start of the poll, not the one in force when it lands", async () => {
    seed(feedKey, [
      makeFeedPage([makeRow({ post_id: 100 }), makeRow({ post_id: 76 })], { feed_version: "v1" }),
      makeFeedPage([makeRow({ post_id: 75 })], { feed_version: "v1" }),
    ]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 105 });
    const gate = deferred<CurationFeedPage>();
    const fetchPageOne = vi.fn(() => gate.promise);

    const { rerender } = renderHook(
      ({ sort }: { sort: "newest" | "unique" }) =>
        useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort }),
      { wrapper, initialProps: { sort: "newest" } as { sort: "newest" | "unique" } }
    );
    await poll();
    // The curator switches sort while page one is still in flight. `unique` has no
    // key to merge on, so reading it here would replace a queue fetched as `newest`.
    rerender({ sort: "unique" });
    await act(async () => {
      gate.resolve(makeFeedPage([makeRow({ post_id: 105 }), makeRow({ post_id: 100 })], { feed_version: "v2" }));
      await flush();
    });

    const data = loaded(feedKey);
    expect(data.pages).toHaveLength(2);
    expect(data.pages[0].items.map((r) => r.post_id)).toEqual([105, 100, 76]);
  });

  /**
   * A row the refresh promoted into page one must leave the later page it came
   * from, or the cache holds it twice. The shared select dedupes by post_id so it
   * never renders twice, but the duplicate is real and inflates the loaded count.
   */
  it("drops a row from its later page once the refresh promoted it into page one", async () => {
    seed(feedKey, [
      makeFeedPage([makeRow({ post_id: 100 }), makeRow({ post_id: 90 })], { feed_version: "v1" }),
      makeFeedPage([makeRow({ post_id: 80 }), makeRow({ post_id: 70 })], { feed_version: "v1" }),
    ]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 105 });
    // The refreshed page now reaches down to 80, which page two also holds.
    const fetchPageOne = vi.fn(async () =>
      makeFeedPage([makeRow({ post_id: 105 }), makeRow({ post_id: 100 }), makeRow({ post_id: 80 })], {
        feed_version: "v2",
      })
    );

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();

    const data = loaded(feedKey);
    expect(data.pages[0].items.map((r) => r.post_id)).toEqual([105, 100, 80]);
    expect(data.pages[1].items.map((r) => r.post_id)).toEqual([70]);
    const all = data.pages.flatMap((p) => p.items.map((r) => r.post_id));
    expect(all).toEqual([...new Set(all)]);
  });

  it("keeps replacing under a sort that has no key to merge on", async () => {
    seed(feedKey, [
      makeFeedPage([makeRow({ post_id: 100 })], { feed_version: "v1" }),
      makeFeedPage([makeRow({ post_id: 75 })], { feed_version: "v1" }),
    ]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 105 });
    const fetchPageOne = vi.fn(async () =>
      makeFeedPage([makeRow({ post_id: 105 }), makeRow({ post_id: 100 })], { feed_version: "v2" })
    );

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "unique" }), { wrapper });
    await poll();

    const data = loaded(feedKey);
    expect(data.pages).toHaveLength(1);
    expect(data.pages[0].items.map((r) => r.post_id)).toEqual([105, 100]);
  });

  it("installs nothing when the filters change while page one is in flight", async () => {
    seed(feedKey, [makeFeedPage([makeRow({ post_id: 1 })], { feed_version: "v1" })]);
    seed(otherFeedKey, [makeFeedPage([makeRow({ post_id: 2 })], { feed_version: "v1" })]);
    const gate = deferred<CurationFeedPage>();
    const fetchPageOne = vi.fn(() => gate.promise);
    const otherFetchPageOne = vi.fn(async () => makeFeedPage([makeRow({ post_id: 8 })]));

    const { rerender } = renderHook(
      ({ key, fetcher }: { key: unknown[]; fetcher: () => Promise<CurationFeedPage> }) =>
        useStatusPoll({ enabled: true, feedKey: key, fetchPageOne: fetcher, feedVersion: "v1", sort: "newest" }),
      { wrapper, initialProps: { key: feedKey as unknown[], fetcher: fetchPageOne } }
    );
    // One quiet poll first, so the next one is a refresh and not a baseline.
    await poll();
    expect(fetchPageOne).not.toHaveBeenCalled();

    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 9 });
    await poll();
    expect(fetchPageOne).toHaveBeenCalledTimes(1);

    // Page one of the queue the viewer is leaving is still in flight.
    rerender({ key: otherFeedKey, fetcher: otherFetchPageOne });
    gate.resolve(makeFeedPage([makeRow({ post_id: 9 })], { feed_version: "v2" }));
    await flush();

    // Those rows were selected for the filters that just went away.
    expect(loaded(otherFeedKey).pages[0].items[0].post_id).toBe(2);
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(1);
    expect(otherFetchPageOne).not.toHaveBeenCalled();
  });

  it("runs one refresh at a time when the interval and a visibilitychange overlap", async () => {
    seed(feedKey, [makeFeedPage([makeRow({ post_id: 1 })], { feed_version: "v1" })]);
    statusBody = makeStatus({ feed_version: "v2", latest_post_id: 9 });
    const gate = deferred<CurationFeedPage>();
    const fetchPageOne = vi.fn(() => gate.promise);

    renderHook(() => useStatusPoll({ enabled: true, feedKey, fetchPageOne, feedVersion: "v1", sort: "newest" }), { wrapper });
    await poll();
    expect(router.callsTo(/curation-desk\/status/)).toHaveLength(1);
    expect(fetchPageOne).toHaveBeenCalledTimes(1);

    // Page one is still in flight: another poll would ask status again and,
    // with the version still uncommitted, start a second refresh.
    await poll();
    await poll();
    expect(router.callsTo(/curation-desk\/status/)).toHaveLength(1);
    expect(fetchPageOne).toHaveBeenCalledTimes(1);

    gate.resolve(makeFeedPage([makeRow({ post_id: 9 })], { feed_version: "v2" }));
    await flush();
    expect(loaded(feedKey).pages[0].items[0].post_id).toBe(9);
  });
});
