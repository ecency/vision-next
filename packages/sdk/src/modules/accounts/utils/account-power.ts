import { parseAsset } from "@/modules/core/utils";
import { DynamicProps } from "@/modules/core/types";
import { FullAccount } from "../types";
import { calculateVPMana, calculateRCMana } from "@/modules/core/hive-tx";
import type { RCAccount } from "@/modules/core/hive-tx";

const HIVE_VOTING_MANA_REGENERATION_SECONDS = 5 * 60 * 60 * 24; // 5 days
const HIVE_100_PERCENT = 10000;
const HIVE_VOTE_DUST_THRESHOLD = 50_000_000;

function getEffectiveVests(account: FullAccount): number {
  const vesting = parseAsset(account.vesting_shares).amount;
  const received = parseAsset(account.received_vesting_shares).amount;
  const delegated = parseAsset(account.delegated_vesting_shares).amount;
  const withdrawRate = parseAsset(account.vesting_withdraw_rate).amount;
  const alreadyWithdrawn =
    (Number(account.to_withdraw) - Number(account.withdrawn)) / 1e6;
  const withdrawVests = Math.min(withdrawRate, alreadyWithdrawn);

  return vesting + received - delegated - withdrawVests;
}

function vestsToRshares(vests: number, votingPowerValue: number, votePerc: number): number {
  const vestingShares = vests * 1e6;
  const power = (votingPowerValue * votePerc) / 1e4 / 50 + 1;
  return (power * vestingShares) / 1e4;
}

function hasStableVoteHardfork(dynamicProps: DynamicProps): boolean {
  if (Number.isFinite(dynamicProps.lastHardfork)) {
    return dynamicProps.lastHardfork >= 28;
  }

  const [major = "0", minor = "0"] = (dynamicProps.currentHardforkVersion ?? "0.0.0").split(".");
  return Number(major) > 1 || (Number(major) === 1 && Number(minor) >= 28);
}

function stableVoteRshares(
  account: FullAccount,
  dynamicProps: DynamicProps,
  weight: number
): number {
  const reserveRate =
    dynamicProps.votePowerReserveRate ||
    Number(dynamicProps.raw?.globalDynamic?.vote_power_reserve_rate ?? 0);

  if (!Number.isFinite(reserveRate) || reserveRate <= 0) {
    return 0;
  }

  const effectiveVests = getEffectiveVests(account);
  if (!Number.isFinite(effectiveVests) || effectiveVests <= 0) {
    return 0;
  }

  const vestingShares = effectiveVests * 1e6;
  const usedMana =
    Math.ceil(
      (vestingShares * weight * 60 * 60 * 24) /
      HIVE_100_PERCENT /
      (reserveRate * HIVE_VOTING_MANA_REGENERATION_SECONDS)
    );

  const mana = calculateVPMana(account);
  const currentMana = Math.min(mana.current_mana, mana.max_mana);

  if (!Number.isFinite(currentMana) || usedMana > currentMana) {
    return 0;
  }

  return Math.max(usedMana - HIVE_VOTE_DUST_THRESHOLD, 0);
}

export function votingRshares(
  account: FullAccount,
  dynamicProps: DynamicProps,
  votingPowerValue: number,
  weight: number = 10000
): number {
  if (!Number.isFinite(votingPowerValue) || !Number.isFinite(weight)) {
    return 0;
  }

  if (hasStableVoteHardfork(dynamicProps)) {
    return stableVoteRshares(account, dynamicProps, weight);
  }

  let totalVests = 0;
  try {
    totalVests = getEffectiveVests(account);
    if (!Number.isFinite(totalVests)) {
      return 0;
    }
  } catch {
    return 0;
  }

  return vestsToRshares(totalVests, votingPowerValue, weight);
}

export function votingPower(account: FullAccount): number {
  const calc = calculateVPMana(account);
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

/**
 * Rewards/stake coefficient, known on Hive as the KE ratio: every VEST ever paid out
 * to the account as author or curation rewards, over the VESTS it still holds and has
 * not delegated away. Both sides are VESTS, so the value is independent of the HIVE
 * price and of the global VESTS/HP rate.
 *
 * Returns null when the account carries no undelegated stake, where the ratio is
 * undefined rather than zero.
 *
 * Limits worth repeating wherever this is displayed: `posting_rewards` counts only the
 * vested half of an author payout, the denominator ignores stake delegated TO the
 * account (so an account curating with received delegation scores high), and the value
 * climbs during a power-down because the numerator is frozen history.
 */
export function rewardsToStakeRatio(account: FullAccount): number | null {
  // A row that carries neither counter is one this SDK version did not fill (a cache
  // entry dehydrated by an older build, say). Absent counters are unknown, not zero,
  // and a confident 0.00 is worse than showing nothing.
  if (account.curation_rewards === undefined && account.posting_rewards === undefined) {
    return null;
  }

  const rewards = (account.curation_rewards ?? 0) + (account.posting_rewards ?? 0);
  const ownVests =
    parseAsset(account.vesting_shares).amount -
    parseAsset(account.delegated_vesting_shares).amount;

  // The SDK's parseAsset hands back a raw parseFloat, so a malformed asset string
  // reaches here as NaN rather than 0. Both sides need the finite check.
  if (!Number.isFinite(rewards) || !Number.isFinite(ownVests) || ownVests <= 0) {
    return null;
  }

  return rewards / ownVests;
}

export function rcPower(account: RCAccount): number {
  const calc = calculateRCMana(account);
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

  const rShares = votingRshares(account, dynamicProps, votingPowerValue, weight);

  if (!Number.isFinite(rShares)) {
    return 0;
  }

  return (rShares / fundRecentClaims) * fundRewardBalance * (base / quote);
}
