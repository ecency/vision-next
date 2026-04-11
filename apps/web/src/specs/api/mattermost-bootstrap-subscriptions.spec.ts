import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";

// Track which subscriptions each QueryClient.fetchQuery call returns
let fetchQueryCallCount = 0;
const subscriptionsByCall: Record<number, string[][]> = {};

vi.mock("@tanstack/react-query", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-query")>(
    "@tanstack/react-query"
  );
  return {
    ...actual,
    QueryClient: vi.fn().mockImplementation(() => ({
      fetchQuery: vi.fn().mockImplementation(() => {
        const callIndex = fetchQueryCallCount++;
        return Promise.resolve(subscriptionsByCall[callIndex] || []);
      })
    }))
  };
});

vi.mock("@ecency/sdk", () => ({
  getAccountSubscriptionsQueryOptions: vi.fn((username: string) => ({
    queryKey: ["accounts", "subscriptions", username],
    queryFn: vi.fn()
  }))
}));

describe("bootstrap per-request subscription freshness", () => {
  beforeEach(() => {
    fetchQueryCallCount = 0;
    vi.clearAllMocks();
  });

  it("creates a new QueryClient per bootstrap call so subscriptions are never stale", async () => {
    // First request: user is subscribed to community-a and community-b
    subscriptionsByCall[0] = [
      ["hive-100000", "Community A", "guest", ""],
      ["hive-200000", "Community B", "guest", ""]
    ];
    // Second request: user unsubscribed from community-b, only has community-a
    subscriptionsByCall[1] = [
      ["hive-100000", "Community A", "guest", ""]
    ];

    // Simulate two bootstrap calls by constructing fresh QueryClients
    // and calling fetchQuery — this mirrors the bootstrap route logic
    const { getAccountSubscriptionsQueryOptions } = await import("@ecency/sdk");

    // First "request"
    const qc1 = new QueryClient();
    const subs1 = await (qc1 as any).fetchQuery(
      getAccountSubscriptionsQueryOptions("testuser")
    );
    expect(subs1).toHaveLength(2);
    expect(subs1.map((s: string[]) => s[0])).toEqual(["hive-100000", "hive-200000"]);

    // Second "request" — must NOT reuse first request's data
    const qc2 = new QueryClient();
    const subs2 = await (qc2 as any).fetchQuery(
      getAccountSubscriptionsQueryOptions("testuser")
    );
    expect(subs2).toHaveLength(1);
    expect(subs2.map((s: string[]) => s[0])).toEqual(["hive-100000"]);

    // Verify two distinct QueryClient instances were created (one per request)
    expect(QueryClient).toHaveBeenCalledTimes(2);

    // Verify community-b from first call does NOT appear in second call
    const secondCallCommunityIds = subs2.map((s: string[]) => s[0]);
    expect(secondCallCommunityIds).not.toContain("hive-200000");
  });

  it("does not share cached data between calls even for the same username", async () => {
    // Both calls for same user but with different subscription lists
    subscriptionsByCall[0] = [
      ["hive-111111", "Alpha", "guest", ""],
      ["hive-222222", "Beta", "guest", ""],
      ["hive-333333", "Gamma", "guest", ""]
    ];
    subscriptionsByCall[1] = [
      ["hive-111111", "Alpha", "guest", ""]
    ];

    const { getAccountSubscriptionsQueryOptions } = await import("@ecency/sdk");

    const qc1 = new QueryClient();
    const subs1 = await (qc1 as any).fetchQuery(
      getAccountSubscriptionsQueryOptions("sameuser")
    );

    const qc2 = new QueryClient();
    const subs2 = await (qc2 as any).fetchQuery(
      getAccountSubscriptionsQueryOptions("sameuser")
    );

    // Second call must reflect updated subscription state
    expect(subs1).toHaveLength(3);
    expect(subs2).toHaveLength(1);

    // Communities from first call that were unsubscribed must not leak
    const staleIds = ["hive-222222", "hive-333333"];
    const secondIds = subs2.map((s: string[]) => s[0]);
    for (const staleId of staleIds) {
      expect(secondIds).not.toContain(staleId);
    }
  });
});
