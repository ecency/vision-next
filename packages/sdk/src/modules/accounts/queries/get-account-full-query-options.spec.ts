import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { getAccountFullQueryOptions } from "./get-account-full-query-options";

const mockCallRPC = vi.hoisted(() => vi.fn());
const mockCallREST = vi.hoisted(() => vi.fn());

vi.mock("@/modules/core/hive-tx", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/modules/core/hive-tx")>();
  return {
    ...actual,
    callRPC: mockCallRPC,
    callREST: mockCallREST
  };
});

// Drive the query through the public TanStack Query API. fetchQuery ignores
// `enabled`, so it exercises the queryFn directly for every username value.
const runQuery = (options: ReturnType<typeof getAccountFullQueryOptions>) =>
  new QueryClient({ defaultOptions: { queries: { retry: false } } }).fetchQuery(options);

describe("getAccountFullQueryOptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates the correct query key", () => {
    expect(getAccountFullQueryOptions("alice").queryKey).toEqual(["get-account-full", "alice"]);
  });

  // Regression: ECENCY-NEXT-13AX. A non-existent account is an expected state
  // (e.g. during signup before the account is finalized on-chain) and must
  // resolve to null rather than throwing, otherwise fetchQuery callers and
  // useQuery consumers surface it as an unhandled rejection.
  describe("missing account", () => {
    it("resolves to null instead of throwing when the account does not exist", async () => {
      mockCallRPC.mockResolvedValue([]);

      await expect(runQuery(getAccountFullQueryOptions("ghost"))).resolves.toBeNull();
    });

    it("resolves to null for an empty username without hitting the network", async () => {
      await expect(runQuery(getAccountFullQueryOptions(""))).resolves.toBeNull();
      expect(mockCallRPC).not.toHaveBeenCalled();
    });

    it("resolves to null for an undefined username without hitting the network", async () => {
      await expect(runQuery(getAccountFullQueryOptions(undefined))).resolves.toBeNull();
      expect(mockCallRPC).not.toHaveBeenCalled();
    });
  });

  describe("existing account", () => {
    const mockAccountAndProfile = () =>
      mockCallRPC.mockImplementation((method: string) => {
        if (method === "condenser_api.get_accounts") {
          return Promise.resolve([
            {
              name: "alice",
              owner: { key_auths: [] },
              active: { key_auths: [] },
              posting: { key_auths: [] },
              memo_key: "STM-memo",
              posting_json_metadata: ""
            }
          ]);
        }
        if (method === "bridge.get_profile") {
          return Promise.resolve({ reputation: 78.29, stats: { followers: 232, following: 27 } });
        }
        return Promise.resolve(null);
      });

    it("returns the parsed account when it exists", async () => {
      mockAccountAndProfile();

      const result = (await runQuery(getAccountFullQueryOptions("alice"))) as any;

      expect(result).not.toBeNull();
      expect(result.name).toBe("alice");
    });

    it("derives reputation + follow_stats from bridge.get_profile and drops the reputation-api / get_follow_count round-trips", async () => {
      mockAccountAndProfile();

      const result = (await runQuery(getAccountFullQueryOptions("alice"))) as any;

      expect(result.reputation).toBe(78.29);
      expect(result.follow_stats).toEqual({
        account: "alice",
        follower_count: 232,
        following_count: 27
      });
      // The reputation-api REST call is gone entirely.
      expect(mockCallREST).not.toHaveBeenCalled();
      // Only get_accounts + bridge.get_profile are called — no separate get_follow_count.
      const methods = mockCallRPC.mock.calls.map((c) => c[0]);
      expect(methods).toContain("condenser_api.get_accounts");
      expect(methods).toContain("bridge.get_profile");
      expect(methods).not.toContain("condenser_api.get_follow_count");
    });

    it("degrades to reputation 0 / undefined follow_stats when bridge.get_profile fails", async () => {
      mockCallRPC.mockImplementation((method: string) => {
        if (method === "condenser_api.get_accounts") {
          return Promise.resolve([
            {
              name: "alice",
              owner: { key_auths: [] },
              active: { key_auths: [] },
              posting: { key_auths: [] },
              memo_key: "STM-memo",
              posting_json_metadata: ""
            }
          ]);
        }
        return Promise.reject(new Error("bridge down"));
      });

      const result = (await runQuery(getAccountFullQueryOptions("alice"))) as any;

      expect(result.name).toBe("alice");
      expect(result.reputation).toBe(0);
      expect(result.follow_stats).toBeUndefined();
    });
  });
});
