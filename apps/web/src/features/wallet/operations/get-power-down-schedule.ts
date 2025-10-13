import { isEmptyDate, parseAsset, vestsToHp } from "@ecency/wallets";

export interface PowerDownSchedule {
  nextWithdrawal: string;
  weeklyHp: number;
  totalHp: number;
  weeks: number;
}

interface AccountPowerDownInfo {
  next_vesting_withdrawal?: string;
  to_withdraw?: string | number;
  withdrawn?: string | number;
  vesting_withdraw_rate?: string;
}

export const getPowerDownSchedule = (
  account: AccountPowerDownInfo | undefined,
  hivePerMVests: number
): PowerDownSchedule | undefined => {
  if (!account || isEmptyDate(account.next_vesting_withdrawal)) {
    return undefined;
  }

  const remainingVests = Math.max(
    Number(account.to_withdraw ?? 0) - Number(account.withdrawn ?? 0),
    0
  );

  if (remainingVests <= 0) {
    return undefined;
  }

  const remainingVestsFormatted = remainingVests / 1e6;
  const weeklyVests = Math.min(
    parseAsset(account.vesting_withdraw_rate ?? "0.000000 VESTS").amount,
    remainingVestsFormatted
  );

  if (weeklyVests <= 0) {
    return undefined;
  }

  const weeklyHp = vestsToHp(weeklyVests, hivePerMVests);
  const totalHp = vestsToHp(remainingVestsFormatted, hivePerMVests);
  const weeks = Math.max(1, Math.ceil(totalHp / weeklyHp));

  return {
    nextWithdrawal: account.next_vesting_withdrawal!,
    weeklyHp,
    totalHp,
    weeks,
  };
};
