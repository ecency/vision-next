import { CONFIG } from "@/modules/core";
import { parseAsset } from "@/modules/core/utils";
import { DynamicProps } from "@/modules/core/types";
import { FullAccount } from "../types";
import type { RCAccount } from "@hiveio/dhive/lib/chain/rc";

const HIVE_VOTING_MANA_REGENERATION_SECONDS = 5 * 60 * 60 * 24; // 5 days

function vestsToRshares(vests: number, votingPowerValue: number, votePerc: number): number {
  const vestingShares = vests * 1e6;
  const power = (votingPowerValue * votePerc) / 1e4 / 50 + 1;
  return (power * vestingShares) / 1e4;
}

export function votingPower(account: FullAccount): number {
  const calc = CONFIG.hiveClient.rc.calculateVPMana(account as any);
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
    parseFloat(account.delegated_vesting_shares) -
    parseFloat(account.vesting_withdraw_rate);
  const elapsed = Math.floor(Date.now() / 1000) - account.downvote_manabar.last_update_time;
  const maxMana = (totalShares * 1000000) / 4;

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
