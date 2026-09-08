import { describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { QueryKeys } from "@ecency/sdk";
import {
  persistQueryCache,
  restoreQueryCache,
  startQueryCachePersistence,
  type PersistStorage
} from "@/core/react-query/persist";

vi.mock("@ecency/sdk", async () => ({
  ...(await vi.importActual<Record<string, unknown>>("@ecency/sdk"))
}));

const MINUTE = 60 * 1000;

function createStorage(seed: Record<string, string> = {}, writeDelayMs = 0) {
  const map = new Map<string, string>(Object.entries(seed));
  /** Every operation in the order it reached storage, for the ordering test. */
  const ops: string[] = [];
  const storage: PersistStorage = {
    read: async (key) => map.get(key) ?? null,
    write: async (key, value) => {
      // A real store does not settle a write in the same microtask a key list
      // settles in. Without that asymmetry an unserialised prune still happens
      // to land in the right order here and the ordering test proves nothing.
      if (writeDelayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, writeDelayMs));
      }
      ops.push(`write:${key}`);
      map.set(key, value);
    },
    remove: async (key) => {
      ops.push(`remove:${key}`);
      map.delete(key);
    },
    keys: async () => [...map.keys()]
  };
  return { map, ops, storage };
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
  it("matches the key shapes the SDK actually builds", () => {
    // The families match by literal prefix so this module stays out of the
    // SDK's spec-mocking surface (same reasoning as DEFAULT_OBSERVER). This is
    // what keeps the literals honest: a renamed key fails here rather than
    // silently switching persistence off.
    expect(QueryKeys.posts.accountPosts("alice", "feed", 20, "alice").slice(0, 2)).toEqual([
      "posts",
      "account-posts"
    ]);
    expect(QueryKeys.posts.postsRanked("hot", "", 20, "alice").slice(0, 2)).toEqual([
      "posts",
      "posts-ranked"
    ]);
    expect(QueryKeys.posts.trendingTags()).toEqual(["posts", "trending-tags"]);
    expect(QueryKeys.communities.list("rank", "", 50).slice(0, 2)).toEqual(["communities", "list"]);
    // Feeds carry their observer in the segment the identity check reads.
    expect(QueryKeys.posts.accountPosts("alice", "feed", 20, "bob")[5]).toBe("bob");
    expect(QueryKeys.posts.postsRanked("hot", "", 20, "bob")[5]).toBe("bob");
  });

  it("leaves another account's rows out of this reader's record", async () => {
    // One QueryClient serves the whole tab and outlives a sign-out, so the
    // previous account's feed is still sitting in it.
    const client = makeClient();
    client.setQueryData(feedKey("alice"), { pages: [[entry("mine")]], pageParams: [null] });
    client.setQueryData(
      ["posts", "account-posts", "bob", "feed", 20, "bob"],
      { pages: [[entry("theirs")]], pageParams: [null] }
    );
    const { map, storage } = createStorage();

    await persistQueryCache(client, storage, "alice");

    const written = JSON.parse(map.get("queries:alice") as string);
    expect(written.state.queries).toHaveLength(1);
    expect(written.state.queries[0].queryKey[2]).toBe("alice");
  });

  it("refuses to restore rows fetched for another reader", async () => {
    const now = Date.now();
    const { storage } = createStorage({
      "queries:alice": seedRecord([
        {
          queryKey: ["posts", "account-posts", "bob", "feed", 20, "bob"],
          data: { pages: [[entry("theirs")]], pageParams: [null] },
          dataUpdatedAt: now - MINUTE
        }
      ])
    });
    const client = makeClient();

    expect(await restoreQueryCache(client, storage, "alice", now)).toBe(0);
  });

  it("does not persist the never-stale tag statistics query", async () => {
    // trendingTagsWithStats sits under the same two segments and is declared
    // staleTime: Infinity, so a restored copy would never refresh.
    const client = makeClient();
    client.setQueryData(["posts", "trending-tags", "stats", 30], [{ name: "hive" }]);
    const { map, storage } = createStorage();

    await persistQueryCache(client, storage, "alice");

    expect(map.has("queries:alice")).toBe(false);
  });

  it("lets the outgoing account's last write land before the next prunes it", async () => {
    // Both instances touch the same store in the same tick on an account
    // switch. Unordered, the write recreates the record the prune just removed.
    // Asserted on the operation order rather than on the record being absent:
    // a prune removes a key that was never written just as happily, so the
    // end state alone cannot tell the fix from the bug.
    const client = makeClient();
    client.setQueryData(feedKey("alice"), { pages: [[entry("a")]], pageParams: [null] });
    const { map, ops, storage } = createStorage({}, 5);

    const disposeAlice = startQueryCachePersistence(client, "alice", storage);
    disposeAlice();
    const disposeBob = startQueryCachePersistence(client, "bob", storage);

    await vi.waitFor(() => expect(ops).toContain("remove:queries:alice"));
    disposeBob();

    expect(ops).toContain("write:queries:alice");
    expect(ops.indexOf("write:queries:alice")).toBeLessThan(ops.indexOf("remove:queries:alice"));
    expect(map.has("queries:alice")).toBe(false);
  });

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
