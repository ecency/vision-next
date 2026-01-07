import { CONFIG } from "@/modules/core";
import { parseAsset } from "@/modules/core/utils";
import { DynamicProps } from "@/modules/core/types";
import { FullAccount } from "../types";
import type { Account as DhiveAccount } from "@hiveio/dhive";
import type { RCAccount } from "@hiveio/dhive/lib/chain/rc";

const HIVE_VOTING_MANA_REGENERATION_SECONDS = 5 * 60 * 60 * 24; // 5 days

function vestsToRshares(vests: number, votingPowerValue: number, votePerc: number): number {
  const vestingShares = vests * 1e6;
  const power = (votingPowerValue * votePerc) / 1e4 / 50 + 1;
  return (power * vestingShares) / 1e4;
}

function toDhiveAccountForVotingMana(account: FullAccount): DhiveAccount {
  return {
    id: 0,
    name: account.name,
    owner: account.owner,
    active: account.active,
    posting: account.posting,
    memo_key: account.memo_key,
    json_metadata: account.json_metadata,
    posting_json_metadata: account.posting_json_metadata,
    proxy: account.proxy ?? "",
    last_owner_update: "",
    last_account_update: "",
    created: account.created,
    mined: false,
    owner_challenged: false,
    active_challenged: false,
    last_owner_proved: "",
    last_active_proved: "",
    recovery_account: account.recovery_account ?? "",
    reset_account: "",
    last_account_recovery: "",
    comment_count: 0,
    lifetime_vote_count: 0,
    post_count: account.post_count,
    can_vote: true,
    voting_power: account.voting_power,
    last_vote_time: account.last_vote_time,
    voting_manabar: account.voting_manabar,
    balance: account.balance,
    savings_balance: account.savings_balance,
    hbd_balance: account.hbd_balance,
    hbd_seconds: "0",
    hbd_seconds_last_update: "",
    hbd_last_interest_payment: "",
    savings_hbd_balance: account.savings_hbd_balance,
    savings_hbd_seconds: account.savings_hbd_seconds,
    savings_hbd_seconds_last_update: account.savings_hbd_seconds_last_update,
    savings_hbd_last_interest_payment: account.savings_hbd_last_interest_payment,
    savings_withdraw_requests: 0,
    reward_hbd_balance: account.reward_hbd_balance,
    reward_hive_balance: account.reward_hive_balance,
    reward_vesting_balance: account.reward_vesting_balance,
    reward_vesting_hive: account.reward_vesting_hive,
    curation_rewards: 0,
    posting_rewards: 0,
    vesting_shares: account.vesting_shares,
    delegated_vesting_shares: account.delegated_vesting_shares,
    received_vesting_shares: account.received_vesting_shares,
    vesting_withdraw_rate: account.vesting_withdraw_rate,
    next_vesting_withdrawal: account.next_vesting_withdrawal,
    withdrawn: account.withdrawn,
    to_withdraw: account.to_withdraw,
    withdraw_routes: 0,
    proxied_vsf_votes: (account.proxied_vsf_votes as number[]) ?? [],
    witnesses_voted_for: 0,
    average_bandwidth: 0,
    lifetime_bandwidth: 0,
    last_bandwidth_update: "",
    average_market_bandwidth: 0,
    lifetime_market_bandwidth: 0,
    last_market_bandwidth_update: "",
    last_post: account.last_post,
    last_root_post: "",
  };
}

export function votingPower(account: FullAccount): number {
  const calc = CONFIG.hiveClient.rc.calculateVPMana(
    toDhiveAccountForVotingMana(account)
  );
  return calc.percentage / 100;
}

export function powerRechargeTime(power: number) {
  if (!Number.isFinite(power)) {
    throw new TypeError("Voting power must be a finite number");
  }
  if (power < 0 || power > 100) {
    throw new RangeError("Voting power must be between 0 and 100");
  }
  const missingPower = 100 - power;
  return (
    (missingPower * 100 * HIVE_VOTING_MANA_REGENERATION_SECONDS) / 10000
  );
}

export function downVotingPower(account: FullAccount): number {
  const totalShares =
    parseFloat(account.vesting_shares) +
    parseFloat(account.received_vesting_shares) -
    parseFloat(account.delegated_vesting_shares);
  const elapsed = Math.floor(Date.now() / 1000) - account.downvote_manabar.last_update_time;
  const maxMana = (totalShares * 1000000) / 4;

  if (maxMana <= 0) {
    return 0;
  }

  let currentMana =
    parseFloat(account.downvote_manabar.current_mana.toString()) +
    (elapsed * maxMana) / HIVE_VOTING_MANA_REGENERATION_SECONDS;

  if (currentMana > maxMana) {
    currentMana = maxMana;
  }
  const currentManaPerc = (currentMana * 100) / maxMana;

  if (isNaN(currentManaPerc)) {
    return 0;
  }

  if (currentManaPerc > 100) {
    return 100;
  }
  return currentManaPerc;
}

export function rcPower(account: RCAccount): number {
  const calc = CONFIG.hiveClient.rc.calculateRCMana(account);
  return calc.percentage / 100;
}

export function votingValue(
  account: FullAccount,
  dynamicProps: DynamicProps,
  votingPowerValue: number,
  weight: number = 10000
): number {
  if (!Number.isFinite(votingPowerValue) || !Number.isFinite(weight)) {
    return 0;
  }
  const { fundRecentClaims, fundRewardBalance, base, quote } = dynamicProps;

  if (
    !Number.isFinite(fundRecentClaims) ||
    !Number.isFinite(fundRewardBalance) ||
    !Number.isFinite(base) ||
    !Number.isFinite(quote)
  ) {
    return 0;
  }

  if (fundRecentClaims === 0 || quote === 0) {
    return 0;
  }

  let totalVests = 0;
  try {
    const vesting = parseAsset(account.vesting_shares).amount;
    const received = parseAsset(account.received_vesting_shares).amount;
    const delegated = parseAsset(account.delegated_vesting_shares).amount;
    if (![vesting, received, delegated].every(Number.isFinite)) {
      return 0;
    }
    totalVests = vesting + received - delegated;
  } catch {
    return 0;
  }

  if (!Number.isFinite(totalVests)) {
    return 0;
  }

  const rShares = vestsToRshares(totalVests, votingPowerValue, weight);
  if (!Number.isFinite(rShares)) {
    return 0;
  }

  return (rShares / fundRecentClaims) * fundRewardBalance * (base / quote);
}
