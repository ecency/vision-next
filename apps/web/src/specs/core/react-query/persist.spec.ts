import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import {
  persistQueryCache,
  restoreQueryCache,
  startQueryCachePersistence,
  type PersistStorage
} from "@/core/react-query/persist";

const MINUTE = 60 * 1000;

function createStorage(seed: Record<string, string> = {}) {
  const map = new Map<string, string>(Object.entries(seed));
  const storage: PersistStorage = {
    read: async (key) => map.get(key) ?? null,
    write: async (key, value) => {
      map.set(key, value);
    },
    remove: async (key) => {
      map.delete(key);
    },
    keys: async () => [...map.keys()]
  };
  return { map, storage };
}

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function feedKey(user = "alice") {
  return ["posts", "account-posts", user, "feed", 20, user];
}

function entry(permlink: string) {
  return { author: "bob", permlink, title: permlink };
}

/** What the browser would have written after reading a feed. */
function seedRecord(
  queries: { queryKey: unknown[]; data: unknown; dataUpdatedAt: number }[],
  build = "dev"
) {
  return JSON.stringify({
    schema: 1,
    build,
    user: "alice",
    at: Date.now(),
    state: {
      mutations: [],
      queries: queries.map(({ queryKey, data, dataUpdatedAt }) => ({
        queryKey,
        queryHash: JSON.stringify(queryKey),
        state: {
          data,
          dataUpdatedAt,
          dataUpdateCount: 1,
          error: null,
          errorUpdateCount: 0,
          errorUpdatedAt: 0,
          fetchFailureCount: 0,
          fetchFailureReason: null,
          fetchMeta: null,
          isInvalidated: false,
          status: "success",
          fetchStatus: "idle"
        }
      }))
    }
  });
}

describe("query cache persistence", () => {
  it("writes only the families a first paint reads", async () => {
    const client = makeClient();
    client.setQueryData(feedKey(), { pages: [[entry("a")]], pageParams: [null] });
    client.setQueryData(["posts", "content", "bob", "a"], { title: "a post" });
    const { map, storage } = createStorage();

    await persistQueryCache(client, storage, "alice");

    const written = JSON.parse(map.get("queries:alice") as string);
    const keys = written.state.queries.map((q: { queryKey: unknown[] }) => q.queryKey[1]);
    expect(keys).toContain("account-posts");
    expect(keys).not.toContain("content");
  });

  it("keeps page one of an infinite feed and drops the rest", async () => {
    const client = makeClient();
    client.setQueryData(feedKey(), {
      pages: [[entry("a")], [entry("b")], [entry("c")]],
      pageParams: [null, "p2", "p3"]
    });
    const { map, storage } = createStorage();

    await persistQueryCache(client, storage, "alice");

    const written = JSON.parse(map.get("queries:alice") as string);
    expect(written.state.queries[0].state.data.pages).toHaveLength(1);
    expect(written.state.queries[0].state.data.pageParams).toHaveLength(1);
  });

  it("restores a recent feed", async () => {
    const now = Date.now();
    const { storage } = createStorage({
      "queries:alice": seedRecord([
        { queryKey: feedKey(), data: { pages: [[entry("a")]], pageParams: [null] }, dataUpdatedAt: now - MINUTE }
      ])
    });
    const client = makeClient();

    const restored = await restoreQueryCache(client, storage, "alice", now);

    expect(restored).toBe(1);
    expect(client.getQueryData(feedKey())).toMatchObject({ pages: [[{ permlink: "a" }]] });
  });

  it("drops a feed older than the family's max age", async () => {
    const now = Date.now();
    const { storage } = createStorage({
      "queries:alice": seedRecord([
        {
          queryKey: feedKey(),
          data: { pages: [[entry("a")]], pageParams: [null] },
          // Past the 10 minute feed window: a social feed this old is worse
          // than the skeleton it would replace.
          dataUpdatedAt: now - 30 * MINUTE
        }
      ])
    });
    const client = makeClient();

    expect(await restoreQueryCache(client, storage, "alice", now)).toBe(0);
    expect(client.getQueryData(feedKey())).toBeUndefined();
  });

  it("discards a record written by another build", async () => {
    const now = Date.now();
    const { map, storage } = createStorage({
      "queries:alice": seedRecord(
        [{ queryKey: feedKey(), data: { pages: [[entry("a")]], pageParams: [null] }, dataUpdatedAt: now }],
        "some-other-release"
      )
    });
    const client = makeClient();

    expect(await restoreQueryCache(client, storage, "alice", now)).toBe(0);
    expect(map.has("queries:alice")).toBe(false);
  });

  it("never replaces fresher data with a persisted copy", async () => {
    // The server just rendered this feed into the page. A restore landing
    // afterwards must not roll it back to what the last visit saw.
    const now = Date.now();
    const client = makeClient();
    client.setQueryData(feedKey(), { pages: [[entry("fresh")]], pageParams: [null] });
    const { storage } = createStorage({
      "queries:alice": seedRecord([
        {
          queryKey: feedKey(),
          data: { pages: [[entry("stale")]], pageParams: [null] },
          dataUpdatedAt: now - 5 * MINUTE
        }
      ])
    });

    await restoreQueryCache(client, storage, "alice", now);

    expect(client.getQueryData(feedKey())).toMatchObject({ pages: [[{ permlink: "fresh" }]] });
  });

  it("keeps one account's feed out of another's, and prunes on a switch", async () => {
    const { map, storage } = createStorage({
      "queries:bob": seedRecord([
        { queryKey: feedKey("bob"), data: { pages: [[entry("b")]], pageParams: [null] }, dataUpdatedAt: Date.now() }
      ])
    });
    const client = makeClient();

    const dispose = startQueryCachePersistence(client, "alice", storage);
    await vi.waitFor(() => expect(map.has("queries:bob")).toBe(false));
    dispose();

    expect(client.getQueryData(feedKey("bob"))).toBeUndefined();
  });

  it("marks the persisted families for revalidation on mount", () => {
    const client = makeClient();

    startQueryCachePersistence(client, "alice", null)();

    expect(client.getQueryDefaults(["posts", "account-posts", "alice", "feed"])).toMatchObject({
      refetchOnMount: true
    });
  });
});
