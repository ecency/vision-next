import { QueryKeys } from "@/modules/core";
import {
  AccountFollowStats,
  FullAccount,
} from "../types";
import { parseProfileMetadata } from "@/modules/accounts";
import { queryOptions } from "@tanstack/react-query";
import { callRPC } from "@/modules/core/hive-tx";

/** The raw `condenser_api.get_accounts` row — every FullAccount field except the three
 *  this query derives separately (follow_stats + reputation from bridge, profile parsed). */
type RawAccount = Omit<FullAccount, "follow_stats" | "reputation" | "profile">;

/** Minimal shape read from `bridge.get_profile` (hivemind social profile): it carries
 *  the reputation score, the follower/following counts and hivemind's parsed
 *  (normalized) profile — the latter is used only to cross-validate the chain row. */
interface BridgeProfile {
  reputation?: number;
  stats?: { followers?: number; following?: number };
  metadata?: { profile?: Record<string, unknown> };
}

/** True when the chain row carries no account metadata at all. Legitimate for
 *  accounts that never set a profile — but combined with a populated hivemind
 *  profile it identifies a node serving stripped account rows. */
function isMetadataStripped(account: RawAccount): boolean {
  return !account.posting_json_metadata && !account.json_metadata;
}

/** True when a hivemind `metadata.profile` object carries at least one real
 *  value. Hivemind emits its fixed profile keys with empty strings for
 *  accounts without a profile, so key presence alone proves nothing. */
function hasProfileValues(profile?: Record<string, unknown> | null): boolean {
  if (!profile) return false;
  return Object.values(profile).some((value) =>
    typeof value === "string" ? value.length > 0 : value != null
  );
}

export function getAccountFullQueryOptions(username: string | undefined) {
  return queryOptions({
    queryKey: QueryKeys.accounts.full(username),
    queryFn: async ({ signal }) => {
      if (!username) {
        return null;
      }

      // Fetch the chain account (balances/keys/vesting) and the hivemind profile in
      // parallel — both only need the username. bridge.get_profile carries BOTH the
      // follower/following counts and the reputation score, so it replaces the old
      // second-layer condenser_api.get_follow_count RPC *and* the reputation-api REST
      // call: condenser_api.get_accounts no longer returns a usable reputation (it is 0
      // since the hardfork), and there is no reason to make two extra round-trips for
      // data one profile object already carries.
      const [response, bridgeProfile] = await Promise.all([
        callRPC<RawAccount[]>(
          "condenser_api.get_accounts",
          [[username]],
          undefined,
          undefined,
          signal
        ),
        callRPC<BridgeProfile>(
          "bridge.get_profile",
          { account: username },
          undefined,
          undefined,
          signal
        ).catch((e): BridgeProfile | null => {
          // A caller cancel (aborted signal) must propagate — only genuine RPC/transport
          // failures degrade to reputation 0 / no follow_stats.
          if (signal?.aborted) throw e;
          return null;
        })
      ]);
      if (!response?.[0]) {
        // The account does not exist (e.g. not yet finalized on-chain during
        // signup). Treat absence as a recoverable null instead of throwing, so
        // consumers (useQuery hooks and fetchQuery callers) surface it as empty
        // data rather than an unhandled rejection / error-boundary crash.
        return null;
      }

      let chainAccount = response[0];

      // Cross-validate the chain row against the hivemind profile fetched in
      // the same query. Some public nodes serve account rows with BOTH
      // metadata fields stripped to "" (observed in the wild) while their own
      // hivemind still returns the real profile — and a merge base built from
      // such a row wipes the user's profile on the next partial
      // account_update2. When the row claims "no metadata" but hivemind
      // disagrees, re-read once (failover may pick another node) and otherwise
      // fail the query: an error here is recoverable, a poisoned cache entry
      // is not.
      if (
        isMetadataStripped(chainAccount) &&
        hasProfileValues(bridgeProfile?.metadata?.profile)
      ) {
        // The re-read carries a payload validator: a stripped row is treated
        // as a node fault, so the failover walk moves on to other nodes (and
        // repeat offenders earn a per-API health cooldown) instead of asking
        // the same lying node twice.
        const reread = await callRPC<RawAccount[]>(
          "condenser_api.get_accounts",
          [[username]],
          undefined,
          undefined,
          signal,
          (rows) =>
            Array.isArray(rows) &&
            (!rows[0] || !isMetadataStripped(rows[0] as RawAccount))
        );
        if (reread[0] && !isMetadataStripped(reread[0])) {
          chainAccount = reread[0];
        } else {
          throw new Error(
            `[SDK][Accounts] – inconsistent account row for ${username}: empty json metadata while hivemind profile is populated`
          );
        }
      }

      const profile = parseProfileMetadata(chainAccount.posting_json_metadata);

      // bridge.get_profile.stats → follower/following counts; `reputation` is the
      // computed score (e.g. 78.29). accountReputation() floors an in-range score, so
      // it yields the same value the reputation-api used to return. Both degrade to a
      // safe default if the profile call failed.
      const stats = bridgeProfile?.stats;
      const follow_stats: AccountFollowStats | undefined = stats
        ? {
            account: chainAccount.name,
            follower_count: stats.followers ?? 0,
            following_count: stats.following ?? 0
          }
        : undefined;
      const reputationValue: number = bridgeProfile?.reputation ?? 0;

      return {
        name: chainAccount.name,
        owner: chainAccount.owner,
        active: chainAccount.active,
        posting: chainAccount.posting,
        memo_key: chainAccount.memo_key,
        post_count: chainAccount.post_count,
        created: chainAccount.created,
        posting_json_metadata: chainAccount.posting_json_metadata,
        last_vote_time: chainAccount.last_vote_time,
        last_post: chainAccount.last_post,
        json_metadata: chainAccount.json_metadata,
        reward_hive_balance: chainAccount.reward_hive_balance,
        reward_hbd_balance: chainAccount.reward_hbd_balance,
        reward_vesting_hive: chainAccount.reward_vesting_hive,
        reward_vesting_balance: chainAccount.reward_vesting_balance,
        balance: chainAccount.balance,
        hbd_balance: chainAccount.hbd_balance,
        savings_balance: chainAccount.savings_balance,
        savings_hbd_balance: chainAccount.savings_hbd_balance,
        savings_hbd_last_interest_payment:
          chainAccount.savings_hbd_last_interest_payment,
        savings_hbd_seconds_last_update:
          chainAccount.savings_hbd_seconds_last_update,
        savings_hbd_seconds: chainAccount.savings_hbd_seconds,
        next_vesting_withdrawal: chainAccount.next_vesting_withdrawal,
        pending_claimed_accounts: chainAccount.pending_claimed_accounts,
        vesting_shares: chainAccount.vesting_shares,
        delegated_vesting_shares: chainAccount.delegated_vesting_shares,
        received_vesting_shares: chainAccount.received_vesting_shares,
        vesting_withdraw_rate: chainAccount.vesting_withdraw_rate,
        to_withdraw: chainAccount.to_withdraw,
        withdrawn: chainAccount.withdrawn,
        witness_votes: chainAccount.witness_votes,
        proxy: chainAccount.proxy,
        recovery_account: chainAccount.recovery_account,
        proxied_vsf_votes: chainAccount.proxied_vsf_votes,
        voting_manabar: chainAccount.voting_manabar,
        voting_power: chainAccount.voting_power,
        downvote_manabar: chainAccount.downvote_manabar,
        follow_stats,
        reputation: reputationValue,
        profile,
      } satisfies FullAccount;
    },
    enabled: !!username,
    staleTime: 60000,
  });
}
