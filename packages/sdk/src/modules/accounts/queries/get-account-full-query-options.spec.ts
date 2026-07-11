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

  // Regression: ECENCY-NEXT-1GHA. Some nodes answer get_accounts with a
  // well-formed envelope carrying `result: null`. The payload validator makes
  // callRPC treat that as a node fault and fail over; should a null still slip
  // through, the queryFn must not crash on `response[0]`.
  describe("null get_accounts payload (node fault)", () => {
    it("passes a payload validator that rejects null and accepts arrays", async () => {
      mockCallRPC.mockResolvedValue([]);

      await runQuery(getAccountFullQueryOptions("alice"));

      const getAccountsCall = mockCallRPC.mock.calls.find(
        (c) => c[0] === "condenser_api.get_accounts"
      );
      const validate = getAccountsCall?.[5] as (result: unknown) => boolean;
      expect(validate).toBeTypeOf("function");
      expect(validate(null)).toBe(false);
      expect(validate(undefined)).toBe(false);
      expect(validate([])).toBe(true);
      expect(validate([{ name: "alice" }])).toBe(true);
    });

    it("resolves to null instead of throwing a TypeError when callRPC still resolves null", async () => {
      mockCallRPC.mockImplementation((method: string) =>
        Promise.resolve(method === "condenser_api.get_accounts" ? null : {})
      );

      await expect(runQuery(getAccountFullQueryOptions("alice"))).resolves.toBeNull();
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

      const result = await runQuery(getAccountFullQueryOptions("alice"));

      expect(result).not.toBeNull();
      expect(result?.name).toBe("alice");
    });

    it("derives reputation + follow_stats from bridge.get_profile and drops the reputation-api / get_follow_count round-trips", async () => {
      mockAccountAndProfile();

      const result = await runQuery(getAccountFullQueryOptions("alice"));

      expect(result?.reputation).toBe(78.29);
      expect(result?.follow_stats).toEqual({
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

      const result = await runQuery(getAccountFullQueryOptions("alice"));

      expect(result?.name).toBe("alice");
      expect(result?.reputation).toBe(0);
      expect(result?.follow_stats).toBeUndefined();
    });

    it("propagates a caller cancel (aborted signal) instead of masking it as a null profile", async () => {
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
        return Promise.reject(new Error("aborted")); // bridge.get_profile fails while cancelled
      });

      const controller = new AbortController();
      controller.abort();
      const options = getAccountFullQueryOptions("alice");
      const queryFn = options.queryFn as (ctx: { signal: AbortSignal }) => Promise<unknown>;

      await expect(queryFn({ signal: controller.signal })).rejects.toBeTruthy();
    });
  });

  // Some public nodes serve account rows with BOTH metadata fields stripped
  // to "" while their own hivemind still returns the real profile. A merge
  // base built from such a row wipes the user's profile on the next partial
  // account_update2 (pin-to-blog etc.), so the query must never resolve with
  // a row that hivemind contradicts.
  describe("stripped-row cross-validation", () => {
    const FULL_PJM = JSON.stringify({
      profile: { name: "Alice", profile_image: "https://img", pinned: "a-post", version: 2 }
    });
    const goodRow = {
      name: "alice",
      owner: { key_auths: [] },
      active: { key_auths: [] },
      posting: { key_auths: [] },
      memo_key: "STM-memo",
      posting_json_metadata: FULL_PJM,
      json_metadata: ""
    };
    const strippedRow = { ...goodRow, posting_json_metadata: "", json_metadata: "" };
    const populatedBridge = {
      reputation: 78.29,
      stats: { followers: 232, following: 27 },
      metadata: { profile: { name: "Alice", profile_image: "https://img", about: "" } }
    };

    const mockGetAccountsSequence = (rows: unknown[][], bridge: unknown) => {
      let call = 0;
      mockCallRPC.mockImplementation((method: string) => {
        if (method === "condenser_api.get_accounts") {
          return Promise.resolve(rows[Math.min(call++, rows.length - 1)]);
        }
        if (method === "bridge.get_profile") {
          return Promise.resolve(bridge);
        }
        return Promise.resolve(null);
      });
    };

    it("re-reads once and recovers when the first row is stripped but hivemind has a profile", async () => {
      mockGetAccountsSequence([[strippedRow], [goodRow]], populatedBridge);

      const result = await runQuery(getAccountFullQueryOptions("alice"));

      expect(result?.profile?.name).toBe("Alice");
      expect(result?.profile?.pinned).toBe("a-post");
      expect(result?.posting_json_metadata).toBe(FULL_PJM);
      const getAccountCalls = mockCallRPC.mock.calls.filter(
        (c) => c[0] === "condenser_api.get_accounts"
      );
      expect(getAccountCalls).toHaveLength(2);
    });

    it("throws instead of resolving when the re-read is stripped too", async () => {
      mockGetAccountsSequence([[strippedRow], [strippedRow]], populatedBridge);

      await expect(runQuery(getAccountFullQueryOptions("alice"))).rejects.toThrow(
        /inconsistent account row/
      );
    });

    it("does not flag a legacy account whose profile lives in json_metadata only", async () => {
      const legacyRow = {
        ...goodRow,
        posting_json_metadata: "",
        json_metadata: JSON.stringify({ profile: { name: "Legacy" } })
      };
      mockGetAccountsSequence([[legacyRow]], populatedBridge);

      const result = await runQuery(getAccountFullQueryOptions("alice"));

      expect(result?.name).toBe("alice");
      expect(
        mockCallRPC.mock.calls.filter((c) => c[0] === "condenser_api.get_accounts")
      ).toHaveLength(1);
    });

    it("does not flag a genuinely profile-less account (hivemind emits empty values)", async () => {
      const emptyBridge = {
        reputation: 25,
        stats: { followers: 0, following: 0 },
        metadata: { profile: { name: "", about: "", profile_image: "" } }
      };
      mockGetAccountsSequence([[strippedRow]], emptyBridge);

      const result = await runQuery(getAccountFullQueryOptions("alice"));

      expect(result?.name).toBe("alice");
      expect(result?.profile).toEqual({});
      expect(
        mockCallRPC.mock.calls.filter((c) => c[0] === "condenser_api.get_accounts")
      ).toHaveLength(1);
    });

    it("does not flag a stripped row when hivemind is unavailable", async () => {
      let call = 0;
      mockCallRPC.mockImplementation((method: string) => {
        if (method === "condenser_api.get_accounts") {
          call++;
          return Promise.resolve([strippedRow]);
        }
        return Promise.reject(new Error("bridge down"));
      });

      const result = await runQuery(getAccountFullQueryOptions("alice"));

      expect(result?.name).toBe("alice");
      expect(call).toBe(1);
    });
  });
});
