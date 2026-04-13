import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  __resetPostAgeCacheForTests,
  getCachedPostCreatedMs,
  refreshPostCreatedMs
} from "@/features/next-middleware";

// Minimal mock — importing the real @ecency/hive-tx fails in jsdom because
// ByteBuffer.ts uses TextEncoder at module level (not available in jsdom).
// Only callRPC is used by post-age-cache, so a stub is sufficient.
vi.mock("@ecency/hive-tx", () => ({
  callRPC: vi.fn()
}));

import { callRPC } from "@ecency/hive-tx";

describe("post-age-cache", () => {
  beforeEach(() => {
    __resetPostAgeCacheForTests();
    vi.mocked(callRPC).mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns undefined when nothing cached", () => {
    expect(getCachedPostCreatedMs("alice", "post")).toBeUndefined();
  });

  it("caches createdMs after successful refresh", async () => {
    vi.mocked(callRPC).mockResolvedValue({ created: "2025-01-15T12:00:00" });

    await refreshPostCreatedMs("alice", "post");

    expect(getCachedPostCreatedMs("alice", "post")).toBe(Date.parse("2025-01-15T12:00:00Z"));
  });

  it("passes correct RPC method, params, timeout, retries", async () => {
    vi.mocked(callRPC).mockResolvedValue({ created: "2025-01-15T12:00:00" });

    await refreshPostCreatedMs("alice", "post");

    expect(callRPC).toHaveBeenCalledWith("condenser_api.get_content", ["alice", "post"], 2000, 2);
  });

  it("negative-caches on RPC failure", async () => {
    vi.mocked(callRPC).mockRejectedValue(new Error("all nodes failed"));

    await refreshPostCreatedMs("alice", "post");

    expect(getCachedPostCreatedMs("alice", "post")).toBeNull();
  });

  it("negative-caches when created field is missing", async () => {
    vi.mocked(callRPC).mockResolvedValue({});

    await refreshPostCreatedMs("alice", "post");

    expect(getCachedPostCreatedMs("alice", "post")).toBeNull();
  });

  it("negative-caches when result is null", async () => {
    vi.mocked(callRPC).mockResolvedValue(null);

    await refreshPostCreatedMs("alice", "post");

    expect(getCachedPostCreatedMs("alice", "post")).toBeNull();
  });

  it("de-duplicates concurrent fetches for the same post", async () => {
    let resolve: (v: unknown) => void;
    const pending = new Promise((r) => {
      resolve = r;
    });
    vi.mocked(callRPC).mockReturnValue(
      pending.then(() => ({ created: "2025-01-15T12:00:00" })) as ReturnType<typeof callRPC>
    );

    const p1 = refreshPostCreatedMs("alice", "post");
    const p2 = refreshPostCreatedMs("alice", "post");
    const p3 = refreshPostCreatedMs("alice", "post");

    resolve!(undefined);
    await Promise.all([p1, p2, p3]);

    expect(callRPC).toHaveBeenCalledTimes(1);
  });

  it("separates cache entries by author/permlink", async () => {
    vi.mocked(callRPC)
      .mockResolvedValueOnce({ created: "2025-01-01T00:00:00" })
      .mockResolvedValueOnce({ created: "2025-06-01T00:00:00" });

    await refreshPostCreatedMs("alice", "post-a");
    await refreshPostCreatedMs("bob", "post-b");

    expect(getCachedPostCreatedMs("alice", "post-a")).toBe(Date.parse("2025-01-01T00:00:00Z"));
    expect(getCachedPostCreatedMs("bob", "post-b")).toBe(Date.parse("2025-06-01T00:00:00Z"));
  });
});
