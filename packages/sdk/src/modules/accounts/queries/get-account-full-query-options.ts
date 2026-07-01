import { QueryKeys } from "@/modules/core";
import {
  AccountFollowStats,
  FullAccount,
} from "../types";
import { parseProfileMetadata } from "@/modules/accounts";
import { queryOptions } from "@tanstack/react-query";
import { callRPC } from "@/modules/core/hive-tx";

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
      const [response, bridgeProfile] = (await Promise.all([
        callRPC("condenser_api.get_accounts", [[username]], undefined, undefined, signal),
        callRPC("bridge.get_profile", { account: username }, undefined, undefined, signal).catch(
          (): any => null
        )
      ])) as [any[], any];
      if (!response[0]) {
        // The account does not exist (e.g. not yet finalized on-chain during
        // signup). Treat absence as a recoverable null instead of throwing, so
        // consumers (useQuery hooks and fetchQuery callers) surface it as empty
        // data rather than an unhandled rejection / error-boundary crash.
        return null;
      }

      const profile = parseProfileMetadata(response[0].posting_json_metadata);

      // bridge.get_profile.stats → follower/following counts; `reputation` is the
      // computed score (e.g. 78.29). accountReputation() floors an in-range score, so
      // it yields the same value the reputation-api used to return. Both degrade to a
      // safe default if the profile call failed.
      const stats = bridgeProfile?.stats;
      const follow_stats: AccountFollowStats | undefined = stats
        ? {
            account: response[0].name,
            follower_count: stats.followers ?? 0,
            following_count: stats.following ?? 0
          }
        : undefined;
      const reputationValue: number = bridgeProfile?.reputation ?? 0;

      return {
        name: response[0].name,
        owner: response[0].owner,
        active: response[0].active,
        posting: response[0].posting,
        memo_key: response[0].memo_key,
        post_count: response[0].post_count,
        created: response[0].created,
        posting_json_metadata: response[0].posting_json_metadata,
        last_vote_time: response[0].last_vote_time,
        last_post: response[0].last_post,
        json_metadata: response[0].json_metadata,
        reward_hive_balance: response[0].reward_hive_balance,
        reward_hbd_balance: response[0].reward_hbd_balance,
        reward_vesting_hive: response[0].reward_vesting_hive,
        reward_vesting_balance: response[0].reward_vesting_balance,
        balance: response[0].balance,
        hbd_balance: response[0].hbd_balance,
        savings_balance: response[0].savings_balance,
        savings_hbd_balance: response[0].savings_hbd_balance,
        savings_hbd_last_interest_payment:
          response[0].savings_hbd_last_interest_payment,
        savings_hbd_seconds_last_update:
          response[0].savings_hbd_seconds_last_update,
        savings_hbd_seconds: response[0].savings_hbd_seconds,
        next_vesting_withdrawal: response[0].next_vesting_withdrawal,
        pending_claimed_accounts: response[0].pending_claimed_accounts,
        vesting_shares: response[0].vesting_shares,
        delegated_vesting_shares: response[0].delegated_vesting_shares,
        received_vesting_shares: response[0].received_vesting_shares,
        vesting_withdraw_rate: response[0].vesting_withdraw_rate,
        to_withdraw: response[0].to_withdraw,
        withdrawn: response[0].withdrawn,
        witness_votes: response[0].witness_votes,
        proxy: response[0].proxy,
        recovery_account: response[0].recovery_account,
        proxied_vsf_votes: response[0].proxied_vsf_votes,
        voting_manabar: response[0].voting_manabar,
        voting_power: response[0].voting_power,
        downvote_manabar: response[0].downvote_manabar,
        follow_stats,
        reputation: reputationValue,
        profile,
      } satisfies FullAccount;
    },
    enabled: !!username,
    staleTime: 60000,
  });
}
