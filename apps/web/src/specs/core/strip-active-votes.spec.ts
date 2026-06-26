import { describe, expect, it } from "vitest";
import type { DehydratedState } from "@tanstack/react-query";
import {
  stripActiveVotesFromDehydratedState,
  stripActiveVotesFromValue
} from "@/core/react-query/strip-active-votes";

function entry(overrides: Record<string, any> = {}) {
  return {
    author: "alice",
    permlink: "p",
    net_rshares: 0,
    stats: { total_votes: 3, flag_weight: 0, gray: false, hide: false },
    active_votes: [
      { voter: "a", rshares: 1 },
      { voter: "b", rshares: 2 },
      { voter: "c", rshares: 3 }
    ],
    ...overrides
  };
}

function dehydrated(data: unknown): DehydratedState {
  return {
    mutations: [],
    queries: [
      {
        queryKey: ["posts", "entry", "/@alice/p"],
        queryHash: "h",
        state: { data, dataUpdatedAt: 0, status: "success" } as any
      } as any
    ]
  };
}

describe("stripActiveVotesFromDehydratedState", () => {
  it("strips active_votes from a single dehydrated entry but keeps stats.total_votes", () => {
    const e = entry();
    const out = stripActiveVotesFromDehydratedState(dehydrated(e));
    const data = out.queries[0].state.data as any;
    expect(data.active_votes).toEqual([]);
    expect(data.stats.total_votes).toBe(3);
    // other fields untouched
    expect(data.author).toBe("alice");
  });

  it("does NOT mutate the original entry (clones)", () => {
    const e = entry();
    stripActiveVotesFromDehydratedState(dehydrated(e));
    expect(e.active_votes).toHaveLength(3);
  });

  it("returns the state UNCHANGED for a logged-in request (currentUser set) — keeps full votes for isVoted", () => {
    const e = entry();
    const state = dehydrated(e);
    const out = stripActiveVotesFromDehydratedState(state, "alice");
    expect(out).toBe(state);
    expect((out.queries[0].state.data as any).active_votes).toHaveLength(3);
  });

  it("strips for an anonymous request (no currentUser)", () => {
    const e = entry();
    const out = stripActiveVotesFromDehydratedState(dehydrated(e), undefined);
    expect((out.queries[0].state.data as any).active_votes).toEqual([]);
  });

  it("leaves entries WITHOUT stats.total_votes intact (so their vote count stays stable)", () => {
    const e = entry({ stats: undefined });
    const out = stripActiveVotesFromDehydratedState(dehydrated(e));
    expect((out.queries[0].state.data as any).active_votes).toHaveLength(3);
  });

  it("leaves an entry with already-empty active_votes referentially unchanged", () => {
    const e = entry({ active_votes: [] });
    const out = stripActiveVotesFromDehydratedState(dehydrated(e));
    expect(out.queries[0].state.data).toBe(e);
  });

  it("strips entries inside an infinite feed (pages of Entry[])", () => {
    const data = {
      pages: [[entry({ permlink: "p1" }), entry({ permlink: "p2" })], [entry({ permlink: "p3" })]],
      pageParams: [null]
    };
    const out = stripActiveVotesFromDehydratedState(dehydrated(data));
    const pages = (out.queries[0].state.data as any).pages;
    expect(pages[0][0].active_votes).toEqual([]);
    expect(pages[0][1].active_votes).toEqual([]);
    expect(pages[1][0].active_votes).toEqual([]);
    expect(pages[0][0].stats.total_votes).toBe(3);
  });

  it("strips a search result that carries a top-level total_votes instead of stats.total_votes", () => {
    const searchResult = {
      author: "alice",
      permlink: "s",
      total_votes: 42,
      active_votes: [
        { voter: "a", rshares: 1 },
        { voter: "b", rshares: 2 }
      ]
    };
    const out = stripActiveVotesFromDehydratedState(
      dehydrated({ pages: [{ results: [searchResult] }], pageParams: [null] })
    );
    const r = (out.queries[0].state.data as any).pages[0].results[0];
    expect(r.active_votes).toEqual([]);
    expect(r.total_votes).toBe(42);
  });

  it("strips entries inside an infinite search feed (pages of { results })", () => {
    const data = {
      pages: [{ results: [entry({ permlink: "s1" }), entry({ permlink: "s2" })], scroll_id: "x" }],
      pageParams: [null]
    };
    const out = stripActiveVotesFromDehydratedState(dehydrated(data));
    const page0 = (out.queries[0].state.data as any).pages[0];
    expect(page0.results[0].active_votes).toEqual([]);
    expect(page0.results[1].active_votes).toEqual([]);
    expect(page0.scroll_id).toBe("x");
  });

  it("strips a plain array of entries (discussion list)", () => {
    const out = stripActiveVotesFromDehydratedState(
      dehydrated([entry({ permlink: "r1" }), entry({ permlink: "r2" })])
    );
    const arr = out.queries[0].state.data as any[];
    expect(arr[0].active_votes).toEqual([]);
    expect(arr[1].active_votes).toEqual([]);
  });

  it("strips a keyed map of entries (raw bridge.get_discussion shape)", () => {
    const data = {
      "alice/p1": entry({ permlink: "p1" }),
      "bob/p2": entry({ permlink: "p2" })
    };
    const out = stripActiveVotesFromDehydratedState(dehydrated(data));
    const d = out.queries[0].state.data as any;
    expect(d["alice/p1"].active_votes).toEqual([]);
    expect(d["bob/p2"].active_votes).toEqual([]);
    expect(d["alice/p1"].stats.total_votes).toBe(3);
  });

  it("leaves non-entry query data untouched", () => {
    const data = { foo: "bar", count: 5, nested: { a: 1 } };
    const out = stripActiveVotesFromDehydratedState(dehydrated(data));
    expect(out.queries[0].state.data).toBe(data);
  });

  it("returns the same query objects when nothing changed", () => {
    const state = dehydrated({ foo: 1 });
    const out = stripActiveVotesFromDehydratedState(state);
    expect(out.queries[0]).toBe(state.queries[0]);
  });
});

describe("stripActiveVotesFromValue (props channel, e.g. profile initialFeed)", () => {
  it("strips an InfiniteData feed value for anonymous requests", () => {
    const feed = {
      pages: [[entry({ permlink: "p1" }), entry({ permlink: "p2" })]],
      pageParams: [null]
    };
    const out = stripActiveVotesFromValue(feed, undefined) as any;
    expect(out.pages[0][0].active_votes).toEqual([]);
    expect(out.pages[0][1].active_votes).toEqual([]);
    expect(out.pages[0][0].stats.total_votes).toBe(3);
  });

  it("strips a plain Entry[] (the profile entryList incl. pinned entry)", () => {
    const list = [entry({ permlink: "pinned" }), entry({ permlink: "a" })];
    const out = stripActiveVotesFromValue(list, undefined) as any[];
    expect(out[0].active_votes).toEqual([]);
    expect(out[1].active_votes).toEqual([]);
  });

  it("returns the value unchanged for a logged-in user", () => {
    const feed = { pages: [[entry({ permlink: "p1" })]], pageParams: [null] };
    const out = stripActiveVotesFromValue(feed, "alice");
    expect(out).toBe(feed);
    expect(out.pages[0][0].active_votes).toHaveLength(3);
  });

  it("passes through undefined (no feed prefetched)", () => {
    expect(stripActiveVotesFromValue(undefined, undefined)).toBeUndefined();
  });
});
