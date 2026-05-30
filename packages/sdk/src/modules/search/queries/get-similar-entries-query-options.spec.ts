import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getSimilarEntriesQueryOptions,
  SIMILAR_ENTRIES_MIN_RENDER,
} from "./get-similar-entries-query-options";
import type { SearchResponse } from "../types/search-response";

const entry = {
  author: "alice",
  permlink: "my-post",
  title: "Nature photography at dawn",
  body: "x".repeat(5000),
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

describe("getSimilarEntriesQueryOptions", () => {
  // getBoundFetch() caches the bound fetch on first call, so reuse one stable
  // mock and reset it per test rather than recreating it (a fresh mock each
  // test wouldn't be picked up by the cached binding).
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds a content-fingerprinted query key", () => {
    const key = getSimilarEntriesQueryOptions(entry).queryKey;
    expect(key.slice(0, 4)).toEqual(["search", "similar-entries", "alice", "my-post"]);
    expect(typeof key[4]).toBe("string");
  });

  it("changes the query key when the post content changes (edited posts refetch)", () => {
    const base = getSimilarEntriesQueryOptions(entry).queryKey;
    const editedTitle = getSimilarEntriesQueryOptions({ ...entry, title: "A new title" }).queryKey;
    const editedTags = getSimilarEntriesQueryOptions({
      ...entry,
      json_metadata: { tags: ["something", "else"] },
    }).queryKey;
    expect(base[4]).not.toBe(editedTitle[4]);
    expect(base[4]).not.toBe(editedTags[4]);
  });

  it("POSTs to /search-api/similar with title, tags, a truncated body and ~6 month since", async () => {
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

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toContain("/search-api/similar");
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.author).toBe("alice");
    expect(payload.permlink).toBe("my-post");
    expect(payload.title).toBe("Nature photography at dawn");
    expect(payload.tags).toEqual(["nature", "photography"]);
    // body is truncated to the excerpt limit
    expect(payload.body.length).toBe(3000);
    expect(payload.since).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    const drift = Math.abs(
      Date.now() - 182 * 24 * 60 * 60 * 1000 - new Date(`${payload.since}Z`).getTime()
    );
    expect(drift).toBeLessThan(60_000);

    expect(result.map((r) => r.author)).toEqual(["c", "d", "e"]);
  });

  it("strips markdown image links and URLs from the body excerpt", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => searchResponse([]) });

    const e = {
      author: "a",
      permlink: "p",
      title: "t",
      body: "![pic](https://images.hive.blog/DQm-big-hash.png) Real prose about nature and hiking https://x.test/y",
      json_metadata: { tags: [] },
    };
    await (getSimilarEntriesQueryOptions(e).queryFn as QueryFn)({ signal: undefined });

    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.body).not.toContain("images.hive.blog");
    expect(payload.body).not.toContain("http");
    expect(payload.body).toContain("Real prose about nature and hiking");
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
  });

  it("handles a post with no tags or body", async () => {
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => searchResponse([]) });

    const options = getSimilarEntriesQueryOptions({ author: "a", permlink: "p" });
    const result = (await (options.queryFn as QueryFn)({
      signal: undefined,
    })) as SearchResponse["results"];

    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.tags).toEqual([]);
    expect(payload.title).toBe("");
    expect(payload.body).toBe("");
    expect(result).toEqual([]);
  });

  it("tolerates a non-array tags value without throwing (Hive json_metadata can be a bare string)", async () => {
    // Regression for Sentry ECENCY-NEXT-1FMA: some posts store
    // json_metadata.tags as a bare string rather than an array. `?? []` only
    // guarded null/undefined, so `.filter` threw and crashed the entry-page
    // SSR prefetch. The call must not throw and the bad tags become [].
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => searchResponse([]) });

    const e = {
      author: "a",
      permlink: "p",
      title: "t",
      body: "b",
      json_metadata: { tags: "photography" },
    };

    let options!: ReturnType<typeof getSimilarEntriesQueryOptions>;
    expect(() => {
      options = getSimilarEntriesQueryOptions(e);
    }).not.toThrow();

    await (options.queryFn as QueryFn)({ signal: undefined });
    const [, init] = fetchMock.mock.calls[0];
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.tags).toEqual([]);
  });

  it("throws on a failed request so the error surfaces (the strip then hides)", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

    const options = getSimilarEntriesQueryOptions(entry);
    await expect(
      (options.queryFn as QueryFn)({ signal: undefined })
    ).rejects.toThrow(/500/);
  });

  it("disables retry so a degraded backend can't retry-storm into a long tail", () => {
    // Regression: the client path had no per-request timeout (fell through to the
    // SDK's INTERNAL_API_TIMEOUT_MS) and React Query's default client retry (3×)
    // turned a /search-api/similar outage into a ~29s post-onload tail. This is a
    // best-effort strip — one attempt, then hide.
    expect(getSimilarEntriesQueryOptions(entry).retry).toBe(false);
  });

  it("exposes a shared min-render threshold of 2", () => {
    expect(SIMILAR_ENTRIES_MIN_RENDER).toBe(2);
  });
});
