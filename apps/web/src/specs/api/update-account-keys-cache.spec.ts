import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { updateAccountKeysCache } from "@/api/mutations/update-account-keys-cache";

// Mock @ecency/sdk to provide a real getAccountFullQueryOptions with a stable queryKey
vi.mock("@ecency/sdk", () => ({
  getAccountFullQueryOptions: (username: string) => ({
    queryKey: ["accounts", "full", username],
    queryFn: vi.fn()
  })
}));

function makeAccount() {
  return {
    name: "testuser",
    owner: {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [
        ["STM_OWNER_OLD", 1],
        ["STM_OWNER_METAMASK", 1]
      ]
    },
    active: {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [
        ["STM_ACTIVE_OLD", 1],
        ["STM_ACTIVE_METAMASK", 1]
      ]
    },
    posting: {
      weight_threshold: 1,
      account_auths: [],
      key_auths: [
        ["STM_POSTING_OLD", 1],
        ["STM_POSTING_METAMASK", 1]
      ]
    },
    memo_key: "STM_MEMO_OLD",
    json_metadata: "",
    posting_json_metadata: "",
    post_count: 0,
    created: "",
    reputation: 0,
    last_vote_time: "",
    last_post: "",
    reward_hbd_balance: "0",
    reward_vesting_hive: "0",
    reward_hive_balance: "0",
    reward_vesting_balance: "0",
    balance: "0",
    vesting_shares: "0",
    hbd_balance: "0",
    savings_balance: "0",
    savings_hbd_balance: "0",
    savings_hbd_seconds: "0",
    savings_hbd_last_interest_payment: "",
    savings_hbd_seconds_last_update: "",
    next_vesting_withdrawal: "",
    pending_claimed_accounts: 0,
    delegated_vesting_shares: "0",
    received_vesting_shares: "0",
    vesting_withdraw_rate: "0",
    to_withdraw: "0",
    withdrawn: "0",
    witness_votes: [],
    proxy: "",
    recovery_account: "",
    proxied_vsf_votes: [],
    voting_manabar: { current_mana: 0, last_update_time: 0 },
    voting_power: 0,
    downvote_manabar: { current_mana: 0, last_update_time: 0 }
  };
}

describe("updateAccountKeysCache", () => {
  let queryClient: QueryClient;
  const qk = ["accounts", "full", "testuser"];

  beforeEach(() => {
    queryClient = new QueryClient();
    queryClient.setQueryData(qk, makeAccount());
  });

  it("removes revoked keys from all authorities", () => {
    updateAccountKeysCache(queryClient, "testuser", {
      revokeMap: {
        owner: ["STM_OWNER_OLD"],
        active: ["STM_ACTIVE_OLD"],
        posting: ["STM_POSTING_OLD"]
      }
    });

    const result = queryClient.getQueryData<any>(qk);

    expect(result.owner.key_auths).toEqual([["STM_OWNER_METAMASK", 1]]);
    expect(result.active.key_auths).toEqual([["STM_ACTIVE_METAMASK", 1]]);
    expect(result.posting.key_auths).toEqual([["STM_POSTING_METAMASK", 1]]);
    // memo_key unchanged
    expect(result.memo_key).toBe("STM_MEMO_OLD");
  });

  it("adds new keys and removes revoked keys", () => {
    updateAccountKeysCache(queryClient, "testuser", {
      addMap: {
        owner: "STM_OWNER_NEW",
        active: "STM_ACTIVE_NEW",
        posting: "STM_POSTING_NEW"
      },
      memoKey: "STM_MEMO_NEW",
      revokeMap: {
        owner: ["STM_OWNER_OLD"],
        active: ["STM_ACTIVE_OLD"],
        posting: ["STM_POSTING_OLD"]
      }
    });

    const result = queryClient.getQueryData<any>(qk);

    // Old keys removed, MetaMask kept, new keys added
    expect(result.owner.key_auths).toEqual([
      ["STM_OWNER_METAMASK", 1],
      ["STM_OWNER_NEW", 1]
    ]);
    expect(result.active.key_auths).toEqual([
      ["STM_ACTIVE_METAMASK", 1],
      ["STM_ACTIVE_NEW", 1]
    ]);
    expect(result.posting.key_auths).toEqual([
      ["STM_POSTING_METAMASK", 1],
      ["STM_POSTING_NEW", 1]
    ]);
    expect(result.memo_key).toBe("STM_MEMO_NEW");
  });

  it("adds new keys without revoking when revokeMap is empty", () => {
    updateAccountKeysCache(queryClient, "testuser", {
      addMap: {
        owner: "STM_OWNER_NEW",
        active: "STM_ACTIVE_NEW",
        posting: "STM_POSTING_NEW"
      },
      memoKey: "STM_MEMO_NEW"
    });

    const result = queryClient.getQueryData<any>(qk);

    // All original keys preserved, new keys appended
    expect(result.owner.key_auths).toHaveLength(3);
    expect(result.active.key_auths).toHaveLength(3);
    expect(result.posting.key_auths).toHaveLength(3);
    expect(result.memo_key).toBe("STM_MEMO_NEW");
  });

  it("does not duplicate keys if new key already exists", () => {
    updateAccountKeysCache(queryClient, "testuser", {
      addMap: {
        owner: "STM_OWNER_OLD",
        active: "STM_ACTIVE_OLD",
        posting: "STM_POSTING_OLD"
      },
      memoKey: "STM_MEMO_OLD"
    });

    const result = queryClient.getQueryData<any>(qk);

    // No duplicates - still 2 keys each
    expect(result.owner.key_auths).toHaveLength(2);
    expect(result.active.key_auths).toHaveLength(2);
    expect(result.posting.key_auths).toHaveLength(2);
  });

  it("does not crash when cache has no data", () => {
    const emptyClient = new QueryClient();

    // Should not throw
    updateAccountKeysCache(emptyClient, "testuser", {
      revokeMap: { owner: ["STM_OWNER_OLD"] }
    });

    // Cache still has no account data (only invalidation marker)
    const result = emptyClient.getQueryData<any>(qk);
    expect(result).toBeUndefined();
  });

  it("handles partial revokeMap (only some authorities)", () => {
    updateAccountKeysCache(queryClient, "testuser", {
      revokeMap: {
        owner: ["STM_OWNER_OLD"]
        // active and posting not specified
      }
    });

    const result = queryClient.getQueryData<any>(qk);

    expect(result.owner.key_auths).toEqual([["STM_OWNER_METAMASK", 1]]);
    // active and posting unchanged
    expect(result.active.key_auths).toHaveLength(2);
    expect(result.posting.key_auths).toHaveLength(2);
  });
});
