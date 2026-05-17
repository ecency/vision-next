import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getSimilarEntriesQueryOptions } from "./get-similar-entries-query-options";
import type { SearchResponse } from "../types/search-response";

const mockCallREST = vi.hoisted(() => vi.fn());

vi.mock("@/modules/core/hive-tx", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/core/hive-tx")>();
  return { ...actual, callREST: mockCallREST };
});

const entry = {
  author: "alice",
  permlink: "my-post",
  json_metadata: { tags: ["nature", "photography"] },
};

type QueryFn = (ctx: { signal?: AbortSignal }) => Promise<unknown>;

function searchResponse(
  results: Partial<SearchResponse["results"][number]>[]
): SearchResponse {
  return {
    hits: results.length,
    took: 1,
    results: results.map((r, i) => ({
      id: i,
      title: "",
      body: "",
      category: "",
      author: `author${i}`,
      permlink: `perm${i}`,
      author_rep: 0,
      total_payout: 0,
      img_url: "",
      created_at: "2025-12-01T00:00:00",
      children: 0,
      tags: [],
      app: "",
      depth: 0,
      ...r,
    })),
  };
}

function freshIso(msAgo = 1000) {
  return new Date(Date.now() - msAgo).toISOString().slice(0, 19);
}

describe("getSimilarEntriesQueryOptions", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    mockCallREST.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds a tag-scoped query key", () => {
    expect(getSimilarEntriesQueryOptions(entry).queryKey).toEqual([
      "search",
      "similar-entries",
      "alice",
      "my-post",
      "* -dporn type:post tag:nature,photography",
    ]);
  });

  it("sends a ~6 month since window + boolean hide_low, and skips HiveSense when primary fills 3", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        searchResponse([
          { author: "c", permlink: "p2" },
          { author: "d", permlink: "p3" },
          { author: "e", permlink: "p4" },
        ]),
    });

    const options = getSimilarEntriesQueryOptions(entry);
    const result = (await (options.queryFn as QueryFn)({
      signal: undefined,
    })) as SearchResponse["results"];

    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.sort).toBe("newest");
    expect(payload.hide_low).toBe(false);
    expect(typeof payload.hide_low).toBe("boolean");
    expect(payload.since).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    const drift = Math.abs(
      Date.now() - 182 * 24 * 60 * 60 * 1000 - new Date(`${payload.since}Z`).getTime()
    );
    expect(drift).toBeLessThan(60_000);

    expect(result.map((r) => r.author)).toEqual(["c", "d", "e"]);
    expect(mockCallREST).not.toHaveBeenCalled();
  });

  it("excludes the source post and nsfw, dedupes by author, caps at 3", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        searchResponse([
          { author: "a", permlink: "my-post", tags: [] }, // same permlink → dropped
          { author: "b", permlink: "p1", tags: ["nsfw"] }, // nsfw → dropped
          { author: "c", permlink: "p2", tags: [] },
          { author: "c", permlink: "p3", tags: [] }, // dup author → dropped
          { author: "d", permlink: "p4", tags: [] },
          { author: "e", permlink: "p5", tags: [] },
          { author: "f", permlink: "p6", tags: [] }, // beyond cap of 3
        ]),
    });

    const options = getSimilarEntriesQueryOptions(entry);
    const result = (await (options.queryFn as QueryFn)({
      signal: undefined,
    })) as SearchResponse["results"];

    expect(result.map((r) => r.author)).toEqual(["c", "d", "e"]);
    expect(mockCallREST).not.toHaveBeenCalled();
  });

  it("falls back to HiveSense (recency-filtered, deduped) when primary is short", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => searchResponse([{ author: "c", permlink: "p2" }]),
    });

    mockCallREST.mockResolvedValueOnce([
      // too old → excluded by the 6-month recency filter
      { author: "old", permlink: "o1", created: "2018-05-15T16:38:15" },
      // muted/low-quality → excluded
      { author: "gray", permlink: "g1", created: freshIso(), stats: { gray: true } },
      // same author as a primary result → deduped
      { author: "c", permlink: "dupe", created: freshIso() },
      // fresh + valid → included
      { author: "hs1", permlink: "h1", created: freshIso(), title: "Fresh One" },
      { author: "hs2", permlink: "h2", created: freshIso() },
      { author: "hs3", permlink: "h3", created: freshIso() }, // beyond cap
    ]);

    const options = getSimilarEntriesQueryOptions(entry);
    const result = (await (options.queryFn as QueryFn)({
      signal: undefined,
    })) as SearchResponse["results"];

    expect(result.map((r) => r.author)).toEqual(["c", "hs1", "hs2"]);
    expect(mockCallREST).toHaveBeenCalledWith(
      "hivesense",
      "/posts/{author}/{permlink}/similar",
      { author: "alice", permlink: "my-post", result_limit: 12, full_posts: 1, truncate: 200 },
      undefined,
      undefined,
      undefined
    );
    // adapter maps HiveSense → SearchResult
    const fresh = result.find((r) => r.author === "hs1")!;
    expect(fresh.title).toBe("Fresh One");
    expect(fresh.tags).toEqual([]);
  });

  it("ignores HiveSense failures (best-effort fallback)", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => searchResponse([{ author: "c", permlink: "p2" }]),
    });
    mockCallREST.mockRejectedValueOnce(new Error("no node serves /hivesense-api"));

    const options = getSimilarEntriesQueryOptions(entry);
    const result = (await (options.queryFn as QueryFn)({
      signal: undefined,
    })) as SearchResponse["results"];

    expect(result.map((r) => r.author)).toEqual(["c"]);
  });

  it("excludes nsfw HiveSense results (json_metadata tag or category) and maps real tags", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => searchResponse([{ author: "c", permlink: "p2" }]),
    });
    mockCallREST.mockResolvedValueOnce([
      // nsfw via json_metadata.tags → excluded
      {
        author: "x",
        permlink: "x1",
        created: freshIso(),
        json_metadata: { tags: ["art", "nsfw"] },
      },
      // nsfw via category → excluded
      { author: "y", permlink: "y1", created: freshIso(), category: "nsfw" },
      // clean → included, tags threaded through
      {
        author: "z",
        permlink: "z1",
        created: freshIso(),
        category: "photography",
        json_metadata: { tags: ["photography", "nature"] },
      },
    ]);

    const options = getSimilarEntriesQueryOptions(entry);
    const result = (await (options.queryFn as QueryFn)({
      signal: undefined,
    })) as SearchResponse["results"];

    expect(result.map((r) => r.author)).toEqual(["c", "z"]);
    const z = result.find((r) => r.author === "z")!;
    expect(z.tags).toEqual(["photography", "nature"]);
  });
});
