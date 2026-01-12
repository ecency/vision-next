import { FullAccount, AccountProfile } from "../types";
import { parseProfileMetadata } from "./profile-metadata";

/**
 * Parses raw account data from Hive API into FullAccount type
 * Handles profile metadata extraction from posting_json_metadata or json_metadata
 */
export function parseAccounts(rawAccounts: any[]): FullAccount[] {
  return rawAccounts.map((x) => {
    const account: FullAccount = {
      name: x.name,
      owner: x.owner,
      active: x.active,
      posting: x.posting,
      memo_key: x.memo_key,
      post_count: x.post_count,
      created: x.created,
      reputation: x.reputation,
      posting_json_metadata: x.posting_json_metadata,
      last_vote_time: x.last_vote_time,
      last_post: x.last_post,
      json_metadata: x.json_metadata,
      reward_hive_balance: x.reward_hive_balance,
      reward_hbd_balance: x.reward_hbd_balance,
      reward_vesting_hive: x.reward_vesting_hive,
      reward_vesting_balance: x.reward_vesting_balance,
      balance: x.balance,
      hbd_balance: x.hbd_balance,
      savings_balance: x.savings_balance,
      savings_hbd_balance: x.savings_hbd_balance,
      savings_hbd_last_interest_payment: x.savings_hbd_last_interest_payment,
      savings_hbd_seconds_last_update: x.savings_hbd_seconds_last_update,
      savings_hbd_seconds: x.savings_hbd_seconds,
      next_vesting_withdrawal: x.next_vesting_withdrawal,
      pending_claimed_accounts: x.pending_claimed_accounts,
      vesting_shares: x.vesting_shares,
      delegated_vesting_shares: x.delegated_vesting_shares,
      received_vesting_shares: x.received_vesting_shares,
      vesting_withdraw_rate: x.vesting_withdraw_rate,
      to_withdraw: x.to_withdraw,
      withdrawn: x.withdrawn,
      witness_votes: x.witness_votes,
      proxy: x.proxy,
      recovery_account: x.recovery_account,
      proxied_vsf_votes: x.proxied_vsf_votes,
      voting_manabar: x.voting_manabar,
      voting_power: x.voting_power,
      downvote_manabar: x.downvote_manabar,
    };

    // Try to parse profile from posting_json_metadata first
    let profile: AccountProfile | undefined = parseProfileMetadata(
      x.posting_json_metadata
    );

    // Fallback to json_metadata if posting_json_metadata didn't have a profile
    if (!profile || Object.keys(profile).length === 0) {
      try {
        const jsonMetadata = JSON.parse(x.json_metadata || "{}");
        if (jsonMetadata.profile) {
          profile = jsonMetadata.profile;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    // Ensure we always have a profile object
    if (!profile || Object.keys(profile).length === 0) {
      profile = {
        about: "",
        cover_image: "",
        location: "",
        name: "",
        profile_image: "",
        website: "",
      };
    }

    return { ...account, profile };
  });
}
