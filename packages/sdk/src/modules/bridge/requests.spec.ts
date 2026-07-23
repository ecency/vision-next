import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCallRPC = vi.hoisted(() => vi.fn());

vi.mock("@/modules/core/hive-tx", () => ({
  callRPC: mockCallRPC,
}));

// Keep the DMCA filter as a pass-through so these tests stay focused on the
// array-guard logic rather than DMCA censoring.
vi.mock("@/modules/posts/utils/filter-dmca-entries", () => ({
  filterDmcaEntry: vi.fn((entries: unknown) => entries),
}));

import { getAccountPosts, getPostsRanked } from "./requests";

describe("bridge requests — non-array API responses", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  describe("getPostsRanked", () => {
    it("returns null and warns when the response is a truthy non-array", async () => {
      mockCallRPC.mockResolvedValue({ error: "unexpected shape" });

      const result = await getPostsRanked("trending");

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("get_ranked_posts returned object")
      );
    });

    it("returns null without warning when the response is null", async () => {
      mockCallRPC.mockResolvedValue(null);

      const result = await getPostsRanked("trending");

      expect(result).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("returns an empty array (not null) for an empty array response", async () => {
      mockCallRPC.mockResolvedValue([]);

      const result = await getPostsRanked("trending");

      expect(result).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("resolves posts when the response is a non-empty array", async () => {
      mockCallRPC.mockResolvedValue([
        { author: "alice", permlink: "p1", json_metadata: {} },
      ]);

      const result = await getPostsRanked("trending");

      expect(result).toHaveLength(1);
      expect(result?.[0]?.author).toBe("alice");
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });

  describe("getAccountPosts", () => {
    it("returns null and warns when the response is a truthy non-array", async () => {
      mockCallRPC.mockResolvedValue({ error: "unexpected shape" });

      const result = await getAccountPosts("posts", "alice");

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("get_account_posts returned object")
      );
    });

    it("returns null without warning when the response is null", async () => {
      mockCallRPC.mockResolvedValue(null);

      const result = await getAccountPosts("posts", "alice");

      expect(result).toBeNull();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("returns an empty array (not null) for an empty array response", async () => {
      mockCallRPC.mockResolvedValue([]);

      const result = await getAccountPosts("posts", "alice");

      expect(result).toEqual([]);
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it("resolves posts when the response is a non-empty array", async () => {
      mockCallRPC.mockResolvedValue([
        { author: "bob", permlink: "p1", json_metadata: {} },
      ]);

      const result = await getAccountPosts("posts", "bob");

      expect(result).toHaveLength(1);
      expect(result?.[0]?.author).toBe("bob");
      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
