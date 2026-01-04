"use client";

import { DEFAULT_DYNAMIC_PROPS } from "@/consts/default-dynamic-props";
import { getDynamicPropsQueryOptions } from "@ecency/sdk";
import { useClientActiveUser } from "@/api/queries";
import { WalletOperationsDialog } from "@/features/wallet";
import { Button } from "@/features/ui";
import { AssetOperation } from "@ecency/wallets";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import i18next from "i18next";
import { useMemo } from "react";
import { dayjs, formattedNumber, parseAsset, secondDiff } from "@/utils";

interface Props {
  username: string;
  className?: string;
}

// Hive stores HBD balances with three decimal places, so accruing interest
// effectively requires holding at least 0.001 HBD in savings. Below that
// threshold there are no satoshis to accumulate seconds against.
const MINIMUM_SAVINGS_BALANCE = 0.001;
const INTEREST_INTERVAL_DAYS = 30;
const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
const UNIX_EPOCH = "1970-01-01T00:00:00";

export function ProfileWalletHbdInterest({ username, className }: Props) {
  const activeUser = useClientActiveUser();
  const isOwnProfile = activeUser?.username === username;

  const { data: account } = useQuery({
    ...getAccountFullQueryOptions(username),
    enabled: Boolean(username),
  });

  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());

  const { hbdInterestRate } = useMemo(
    () => dynamicProps ?? DEFAULT_DYNAMIC_PROPS,
    [dynamicProps]
  );

  const aprAnnualPercent = useMemo(() => hbdInterestRate / 100, [hbdInterestRate]);

  const savingsBalance = useMemo(() => {
    const balanceString = account?.savings_hbd_balance ?? "0.000 HBD";
    return parseAsset(balanceString).amount;
  }, [account?.savings_hbd_balance]);

  const trackedHbdSeconds = useMemo(() => {
    const value = account?.savings_hbd_seconds;

    if (typeof value === "number" && Number.isFinite(value)) {
      return value / 1000;
    }

    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      if (Number.isFinite(parsed)) {
        return parsed / 1000;
      }
    }

    return 0;
  }, [account?.savings_hbd_seconds]);

  const lastUpdate = useMemo(() => {
    const value = account?.savings_hbd_seconds_last_update;
    if (!value || value === UNIX_EPOCH) {
      return null;
    }

    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }, [account?.savings_hbd_seconds_last_update]);

  const lastInterestPayment = useMemo(() => {
    const value = account?.savings_hbd_last_interest_payment;
    if (!value || value === UNIX_EPOCH) {
      return null;
    }
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed : null;
  }, [account?.savings_hbd_last_interest_payment]);

  const now = dayjs();

  const claimReferenceDate = lastInterestPayment ?? lastUpdate;

  const secondsSinceLastUpdate = useMemo(() => {
    const value = account?.savings_hbd_seconds_last_update;
    if (!value || value === UNIX_EPOCH) {
      return 0;
    }

    return secondDiff(value);
  }, [account?.savings_hbd_seconds_last_update]);

  const pendingSeconds = savingsBalance * secondsSinceLastUpdate;
  const secondsToEstimate = trackedHbdSeconds + pendingSeconds;

  const pendingInterest = useMemo(() => {
    if (hbdInterestRate <= 0) {
      return 0;
    }

    const aprDecimal = hbdInterestRate / 10000;
    return (secondsToEstimate / SECONDS_PER_YEAR) * aprDecimal;
  }, [hbdInterestRate, secondsToEstimate]);

  const pendingInterestDisplay = formattedNumber(pendingInterest);
  const hasPendingInterest = pendingInterest >= MINIMUM_SAVINGS_BALANCE;

  const nextClaimDate = claimReferenceDate
    ? claimReferenceDate.add(INTEREST_INTERVAL_DAYS, "day")
    : null;

  const hasMinimumBalance = savingsBalance >= MINIMUM_SAVINGS_BALANCE;
  const canClaim = Boolean(
    hasMinimumBalance &&
      nextClaimDate &&
      now.isAfter(nextClaimDate) &&
      hasPendingInterest
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
        apr: aprAnnualPercent.toFixed(3),
      })
    : undefined;

  if (savingsBalance < MINIMUM_SAVINGS_BALANCE) {
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
            {pendingInterestDisplay} HBD
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
