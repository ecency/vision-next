import { describe, it, expect, vi, beforeEach } from "vitest";
import { CONFIG } from "@/modules/core";

// Must use vi.hoisted for variables referenced in vi.mock factories
const mockCall = vi.hoisted(() => vi.fn());
const mockClientConstructor = vi.hoisted(() =>
  vi.fn().mockImplementation(() => ({ call: mockCall }))
);

vi.mock("@hiveio/dhive", () => ({
  Client: mockClientConstructor,
}));

vi.mock("@/modules/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/core")>();
  return {
    ...actual,
    CONFIG: {
      hiveClient: {
        address: [
          "https://api.hive.blog",
          "https://api.deathwing.me",
          "https://api.openhive.network",
        ],
        currentAddress: "https://api.hive.blog",
      },
    },
  };
});

// Import after mocks are set up
import { verifyPostOnAlternateNode, MAX_ALTERNATE_NODES } from "./verify-on-alternate-node";

describe("verifyPostOnAlternateNode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset node config
    (CONFIG.hiveClient as any).address = [
      "https://api.hive.blog",
      "https://api.deathwing.me",
      "https://api.openhive.network",
    ];
    (CONFIG.hiveClient as any).currentAddress = "https://api.hive.blog";
  });

  it("should return null when node list has fewer than 2 nodes", async () => {
    (CONFIG.hiveClient as any).address = ["https://api.hive.blog"];

    const result = await verifyPostOnAlternateNode("author", "permlink", "", "https://api.hive.blog");
    expect(result).toBeNull();
    expect(mockClientConstructor).not.toHaveBeenCalled();
    expect(mockCall).not.toHaveBeenCalled();
  });

  it("should skip the primary node snapshot and try alternates", async () => {
    const mockEntry = { author: "author", permlink: "permlink", post_id: 123 };
    mockCall.mockResolvedValueOnce(mockEntry);

    const result = await verifyPostOnAlternateNode("author", "permlink", "", "https://api.hive.blog");

    expect(result).toEqual(mockEntry);
    expect(mockClientConstructor).toHaveBeenCalledTimes(1);
    expect(mockClientConstructor).toHaveBeenCalledWith(
      "https://api.deathwing.me",
      expect.objectContaining({ timeout: 10000 })
    );
    expect(mockCall).toHaveBeenCalledTimes(1);
    expect(mockCall).toHaveBeenCalledWith("bridge", "get_post", {
      author: "author",
      permlink: "permlink",
      observer: "",
    });
  });

  it("should return null when all alternate nodes return null", async () => {
    mockCall.mockResolvedValue(null);

    const result = await verifyPostOnAlternateNode("author", "permlink", "obs", "https://api.hive.blog");

    expect(result).toBeNull();
    expect(mockCall).toHaveBeenCalledTimes(MAX_ALTERNATE_NODES);
    expect(mockClientConstructor).toHaveBeenCalledTimes(MAX_ALTERNATE_NODES);
    // Verify each alternate was tried with correct URL
    expect(mockClientConstructor).toHaveBeenNthCalledWith(
      1, "https://api.deathwing.me", expect.objectContaining({ timeout: 10000 })
    );
    expect(mockClientConstructor).toHaveBeenNthCalledWith(
      2, "https://api.openhive.network", expect.objectContaining({ timeout: 10000 })
    );
  });

  it("should try next node when first alternate throws", async () => {
    const mockEntry = { author: "author", permlink: "permlink", post_id: 456 };
    mockCall.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce(mockEntry);

    const result = await verifyPostOnAlternateNode("author", "permlink", "", "https://api.hive.blog");

    expect(result).toEqual(mockEntry);
    expect(mockCall).toHaveBeenCalledTimes(2);
    expect(mockClientConstructor).toHaveBeenNthCalledWith(
      1, "https://api.deathwing.me", expect.objectContaining({ timeout: 10000 })
    );
    expect(mockClientConstructor).toHaveBeenNthCalledWith(
      2, "https://api.openhive.network", expect.objectContaining({ timeout: 10000 })
    );
  });

  it("should return null when all alternates throw", async () => {
    mockCall.mockRejectedValue(new Error("network error"));

    const result = await verifyPostOnAlternateNode("author", "permlink", "", "https://api.hive.blog");

    expect(result).toBeNull();
    expect(mockCall).toHaveBeenCalledTimes(MAX_ALTERNATE_NODES);
  });

  it("should try at most MAX_ALTERNATE_NODES alternate nodes", async () => {
    (CONFIG.hiveClient as any).address = [
      "https://node1.com",
      "https://node2.com",
      "https://node3.com",
      "https://node4.com",
      "https://node5.com",
    ];
    mockCall.mockResolvedValue(null);

    await verifyPostOnAlternateNode("author", "permlink", "", "https://node1.com");

    expect(mockCall).toHaveBeenCalledTimes(MAX_ALTERNATE_NODES);
    expect(mockClientConstructor).toHaveBeenCalledTimes(MAX_ALTERNATE_NODES);
  });

  it("should fall back to currentAddress when no primaryNode provided", async () => {
    mockCall.mockResolvedValue(null);

    const result = await verifyPostOnAlternateNode("author", "permlink", "");

    expect(result).toBeNull();
    // Falls back to CONFIG.hiveClient.currentAddress (hive.blog), excludes it by identity
    expect(mockCall).toHaveBeenCalledTimes(MAX_ALTERNATE_NODES);
    expect(mockClientConstructor).toHaveBeenNthCalledWith(
      1, "https://api.deathwing.me", expect.objectContaining({ timeout: 10000 })
    );
    expect(mockClientConstructor).toHaveBeenNthCalledWith(
      2, "https://api.openhive.network", expect.objectContaining({ timeout: 10000 })
    );
  });

  it("should use primaryNode snapshot to exclude the correct node even if currentAddress changed", async () => {
    // Simulate: primary was hive.blog, but failover moved currentAddress to deathwing
    (CONFIG.hiveClient as any).currentAddress = "https://api.deathwing.me";
    const mockEntry = { author: "author", permlink: "permlink", post_id: 789 };
    mockCall.mockResolvedValueOnce(mockEntry);

    // Pass the snapshot of hive.blog as primaryNode
    const result = await verifyPostOnAlternateNode("author", "permlink", "", "https://api.hive.blog");

    expect(result).toEqual(mockEntry);
    // Should exclude hive.blog (the snapshot), not deathwing (the current)
    expect(mockClientConstructor).toHaveBeenCalledTimes(1);
    expect(mockClientConstructor).toHaveBeenCalledWith(
      "https://api.deathwing.me",
      expect.objectContaining({ timeout: 10000 })
    );
  });

  it("should reject response with mismatched author/permlink", async () => {
    // Node returns a valid-looking entry but for a different post
    const wrongEntry = { author: "other-author", permlink: "other-permlink", post_id: 999 };
    mockCall.mockResolvedValue(wrongEntry);

    const result = await verifyPostOnAlternateNode("author", "permlink", "", "https://api.hive.blog");

    expect(result).toBeNull();
    // Tried both alternates, both returned mismatched data
    expect(mockCall).toHaveBeenCalledTimes(MAX_ALTERNATE_NODES);
  });

  it("should accept response only when author and permlink match", async () => {
    // First node returns mismatched, second returns correct
    const wrongEntry = { author: "wrong", permlink: "permlink", post_id: 100 };
    const correctEntry = { author: "author", permlink: "permlink", post_id: 200 };
    mockCall.mockResolvedValueOnce(wrongEntry).mockResolvedValueOnce(correctEntry);

    const result = await verifyPostOnAlternateNode("author", "permlink", "", "https://api.hive.blog");

    expect(result).toEqual(correctEntry);
    expect(mockCall).toHaveBeenCalledTimes(2);
  });
});
