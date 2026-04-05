import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetPostAgeCacheForTests,
  getCachedPostCreatedMs,
  refreshPostCreatedMs
} from "@/features/next-middleware";

describe("post-age-cache", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    __resetPostAgeCacheForTests();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("returns undefined when nothing cached", () => {
    expect(getCachedPostCreatedMs("alice", "post")).toBeUndefined();
  });

  it("caches createdMs after successful refresh", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: { created: "2025-01-15T12:00:00" } })
    }) as unknown as typeof fetch;

    await refreshPostCreatedMs("alice", "post");

    const expected = Date.parse("2025-01-15T12:00:00Z");
    expect(getCachedPostCreatedMs("alice", "post")).toBe(expected);
  });

  it("negative-caches on fetch failure", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;

    await refreshPostCreatedMs("alice", "post");

    expect(getCachedPostCreatedMs("alice", "post")).toBeNull();
  });

  it("negative-caches when created field is missing", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ result: {} })
    }) as unknown as typeof fetch;

    await refreshPostCreatedMs("alice", "post");

    expect(getCachedPostCreatedMs("alice", "post")).toBeNull();
  });

  it("negative-caches when HTTP status is not OK", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({})
    }) as unknown as typeof fetch;

    await refreshPostCreatedMs("alice", "post");

    expect(getCachedPostCreatedMs("alice", "post")).toBeNull();
  });

  it("de-duplicates concurrent fetches for the same post", async () => {
    let resolveFetch: (v: unknown) => void;
    const pending = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn().mockReturnValue(
      pending.then(() => ({
        ok: true,
        json: async () => ({ result: { created: "2025-01-15T12:00:00" } })
      }))
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const p1 = refreshPostCreatedMs("alice", "post");
    const p2 = refreshPostCreatedMs("alice", "post");
    const p3 = refreshPostCreatedMs("alice", "post");

    resolveFetch!(undefined);
    await Promise.all([p1, p2, p3]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("separates cache entries by author/permlink", async () => {
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { created: "2025-01-01T00:00:00" } })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: { created: "2025-06-01T00:00:00" } })
      }) as unknown as typeof fetch;

    await refreshPostCreatedMs("alice", "post-a");
    await refreshPostCreatedMs("bob", "post-b");

    expect(getCachedPostCreatedMs("alice", "post-a")).toBe(
      Date.parse("2025-01-01T00:00:00Z")
    );
    expect(getCachedPostCreatedMs("bob", "post-b")).toBe(
      Date.parse("2025-06-01T00:00:00Z")
    );
  });
});
