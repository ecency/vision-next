"use client";

import { useClientActiveUser } from "@/api/queries";
import { WalletOperationsDialog } from "@/features/wallet";
import { Button } from "@/features/ui";
import { AssetOperation, getAccountWalletAssetInfoQueryOptions } from "@ecency/wallets";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useMemo } from "react";
import { dayjs, parseAsset } from "@/utils";

interface Props {
  username: string;
  className?: string;
}

const MINIMUM_SAVINGS_BALANCE = 0.01;
const INTEREST_INTERVAL_DAYS = 30;
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;

export function ProfileWalletHbdInterest({ username, className }: Props) {
  const activeUser = useClientActiveUser();
  const isOwnProfile = activeUser?.username === username;

  const { data: account } = useQuery({
    ...getAccountFullQueryOptions(username),
    enabled: Boolean(username),
  });

  const { data: assetInfo } = useQuery({
    ...getAccountWalletAssetInfoQueryOptions(username, "HBD"),
    enabled: Boolean(username),
  });

  const aprPercent = useMemo(() => {
    const parsed = Number.parseFloat(assetInfo?.apr ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
  }, [assetInfo?.apr]);

  const savingsBalance = useMemo(() => {
    const balanceString = account?.savings_hbd_balance ?? "0.000 HBD";
    return parseAsset(balanceString).amount;
  }, [account?.savings_hbd_balance]);

  const savingsSeconds = useMemo(() => {
    const parsed = Number(account?.savings_hbd_seconds ?? "0");
    return Number.isFinite(parsed) ? parsed : 0;
  }, [account?.savings_hbd_seconds]);

  const lastUpdate = useMemo(() => {
    const value = account?.savings_hbd_seconds_last_update;
    const parsed = value ? dayjs(value) : null;
    return parsed && parsed.isValid() ? parsed : null;
  }, [account?.savings_hbd_seconds_last_update]);

  const now = dayjs();
  const secondsSinceLastUpdate = lastUpdate
    ? Math.max(0, now.diff(lastUpdate, "second"))
    : 0;
  const accruedSeconds = savingsSeconds + secondsSinceLastUpdate * savingsBalance;

  const estimatedInterest =
    (accruedSeconds * (aprPercent / 100)) / SECONDS_PER_YEAR;
  const estimatedInterestDisplay = Number.isFinite(estimatedInterest)
    ? estimatedInterest
    : 0;

  const nextClaimDate = lastUpdate
    ? lastUpdate.add(INTEREST_INTERVAL_DAYS, "day")
    : null;

  const hasMinimumBalance = savingsBalance >= MINIMUM_SAVINGS_BALANCE;
  const canClaim = Boolean(
    hasMinimumBalance &&
      nextClaimDate &&
      now.isAfter(nextClaimDate)
  );

  const nextClaimDescription = (() => {
    if (!hasMinimumBalance) {
      return i18next.t("profile-wallet.hbd-interest.minimum-balance", {
        amount: MINIMUM_SAVINGS_BALANCE.toFixed(3),
      });
    }

    if (!nextClaimDate) {
      return i18next.t("profile-wallet.hbd-interest.next-unknown");
    }

    if (canClaim) {
      return i18next.t("profile-wallet.hbd-interest.next-ready");
    }

    return i18next.t("profile-wallet.hbd-interest.next-in", {
      relative: nextClaimDate.fromNow(),
    });
  })();

  const nextClaimExact = nextClaimDate?.format("LLL");

  const helperText = hasMinimumBalance
    ? i18next.t("profile-wallet.hbd-interest.note", {
        apr: aprPercent.toFixed(3),
      })
    : undefined;

  if (savingsBalance <= 0) {
    return null;
  }

  const claimButton = (
    <Button
      appearance="primary"
      className="w-full sm:w-auto"
      size="sm"
      disabled={!isOwnProfile || !canClaim}
    >
      {i18next.t("profile-wallet.hbd-interest.claim-button")}
    </Button>
  );

  return (
    <div
      className={clsx(
        "bg-white/80 dark:bg-dark-200/90 glass-box rounded-xl p-3 flex flex-col gap-4",
        className
      )}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("profile-wallet.hbd-interest.title")}
          </div>
          <div className="text-2xl font-semibold">
            {estimatedInterestDisplay.toFixed(3)} HBD
          </div>
        </div>
        {isOwnProfile && canClaim ? (
          <WalletOperationsDialog
            asset="HBD"
            operation={AssetOperation.ClaimInterest}
            to={username}
          >
            {claimButton}
          </WalletOperationsDialog>
        ) : (
          claimButton
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            {i18next.t("profile-wallet.hbd-interest.next-label")}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {nextClaimDescription}
          </div>
          {nextClaimExact && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {i18next.t("profile-wallet.hbd-interest.next-date", {
                date: nextClaimExact,
              })}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
            {i18next.t("profile-wallet.hbd-interest.balance-label")}
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {savingsBalance.toFixed(3)} HBD
          </div>
          {helperText && (
            <div className="text-xs text-gray-500 dark:text-gray-400">{helperText}</div>
          )}
        </div>
      </div>
    </div>
  );
}
