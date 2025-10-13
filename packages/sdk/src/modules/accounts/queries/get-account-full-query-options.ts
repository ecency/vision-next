import { CONFIG } from "@/modules/core/config";
import {
  AccountFollowStats,
  AccountProfile,
  AccountReputation,
  FullAccount,
} from "../types";
import { queryOptions } from "@tanstack/react-query";

export function getAccountFullQueryOptions(username: string | undefined) {
  return queryOptions({
    queryKey: ["get-account-full", username],
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK] Username is empty");
      }

      const response = (await CONFIG.hiveClient.database.getAccounts([
        username,
      ])) as any[];
      if (!response[0]) {
        throw new Error("[SDK] No account with given username");
      }

      let profile: AccountProfile = {};
      try {
        profile = JSON.parse(response[0].posting_json_metadata!)
          .profile as AccountProfile;
      } catch (e) {}

      let follow_stats: AccountFollowStats | undefined;
      try {
        follow_stats = await CONFIG.hiveClient.database.call(
          "get_follow_count",
          [username]
        );
      } catch (e) {}

      let reputationValue = 0;
      try {
        const reputation = (await CONFIG.hiveClient.call(
          "condenser_api",
          "get_account_reputations",
          [username, 1]
        )) as AccountReputation[];
        reputationValue = reputation[0]?.reputation ?? 0;
      } catch (e) {}

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
