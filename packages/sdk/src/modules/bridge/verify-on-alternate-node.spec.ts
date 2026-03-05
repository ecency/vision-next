import { describe, it, expect, vi, beforeEach } from "vitest";
import { CONFIG } from "@/modules/core";

// Must use vi.hoisted for variables referenced in vi.mock factories
const mockCall = vi.hoisted(() => vi.fn());

vi.mock("@hiveio/dhive", () => ({
  Client: vi.fn().mockImplementation(() => ({
    call: mockCall,
  })),
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
import { verifyPostOnAlternateNode } from "./verify-on-alternate-node";

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

    const result = await verifyPostOnAlternateNode("author", "permlink", "");
    expect(result).toBeNull();
    expect(mockCall).not.toHaveBeenCalled();
  });

  it("should skip the current node and try alternates", async () => {
    const mockEntry = { author: "author", permlink: "permlink", post_id: 123 };
    mockCall.mockResolvedValueOnce(mockEntry);

    const result = await verifyPostOnAlternateNode("author", "permlink", "");

    expect(result).toEqual(mockEntry);
    expect(mockCall).toHaveBeenCalledTimes(1);
    expect(mockCall).toHaveBeenCalledWith("bridge", "get_post", {
      author: "author",
      permlink: "permlink",
      observer: "",
    });
  });

  it("should return null when all alternate nodes return null", async () => {
    mockCall.mockResolvedValue(null);

    const result = await verifyPostOnAlternateNode("author", "permlink", "obs");

    expect(result).toBeNull();
    expect(mockCall).toHaveBeenCalledTimes(2);
  });

  it("should try next node when first alternate throws", async () => {
    const mockEntry = { author: "author", permlink: "permlink", post_id: 456 };
    mockCall.mockRejectedValueOnce(new Error("timeout")).mockResolvedValueOnce(mockEntry);

    const result = await verifyPostOnAlternateNode("author", "permlink", "");

    expect(result).toEqual(mockEntry);
    expect(mockCall).toHaveBeenCalledTimes(2);
  });

  it("should return null when all alternates throw", async () => {
    mockCall.mockRejectedValue(new Error("network error"));

    const result = await verifyPostOnAlternateNode("author", "permlink", "");

    expect(result).toBeNull();
    expect(mockCall).toHaveBeenCalledTimes(2);
  });

  it("should try at most 2 alternate nodes", async () => {
    (CONFIG.hiveClient as any).address = [
      "https://node1.com",
      "https://node2.com",
      "https://node3.com",
      "https://node4.com",
      "https://node5.com",
    ];
    (CONFIG.hiveClient as any).currentAddress = "https://node1.com";
    mockCall.mockResolvedValue(null);

    await verifyPostOnAlternateNode("author", "permlink", "");

    expect(mockCall).toHaveBeenCalledTimes(2);
  });
});
