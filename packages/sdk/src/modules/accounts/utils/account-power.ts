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
  const missingPower = 100 - power;
  return (missingPower * 100 * 432000) / 10000;
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
  const { fundRecentClaims, fundRewardBalance, base, quote } = dynamicProps;

  const total_vests =
    parseAsset(account.vesting_shares).amount +
    parseAsset(account.received_vesting_shares).amount -
    parseAsset(account.delegated_vesting_shares).amount;

  const rShares = vestsToRshares(total_vests, votingPowerValue, weight);

  return (rShares / fundRecentClaims) * fundRewardBalance * (base / quote);
}
