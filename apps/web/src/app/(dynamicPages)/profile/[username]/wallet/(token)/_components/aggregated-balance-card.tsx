"use client";

import {
  getAggregatedBalanceQueryOptions,
  getDynamicPropsQueryOptions,
  vestsToHp,
  type BalanceCoinType,
} from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useMemo } from "react";
import { formattedNumber } from "@/utils";

interface Props {
  username: string;
  coinType: BalanceCoinType;
}

function formatValue(
  millis: number,
  coinType: BalanceCoinType,
  hivePerMVests: number
): string {
  if (coinType === "VESTS") {
    // API returns micro-vests (6 decimals), divide by 1e6 to get standard VESTS
    const hp = vestsToHp(millis / 1e6, hivePerMVests);
    return formattedNumber(hp, { fractionDigits: 3, suffix: " HP" });
  }
  const human = millis / 1000;
  const suffix = coinType === "HBD" ? " HBD" : " HIVE";
  return formattedNumber(human, { fractionDigits: 3, suffix });
}

export function AggregatedBalanceCard({ username, coinType }: Props) {
  const { data } = useQuery(getAggregatedBalanceQueryOptions(username, coinType));
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const hivePerMVests = dynamicProps?.hivePerMVests ?? 0;

  const { current, change, min, max } = useMemo(() => {
    if (!data || data.length === 0) {
      return { current: null, change: null, min: null, max: null };
    }

    const latest = data[0];
    const prev = data[1];

    const currentBal = Number(latest.balance.balance);
    // Prefer the SDK-provided prior value when there's no previous yearly entry
    const prevBal = prev
      ? Number(prev.balance.balance)
      : Number(latest.prev_balance?.balance ?? 0);
    // If no reliable previous value exists, return null so UI can render "--"
    const hasPrev = prev || latest.prev_balance?.balance;
    const changeBal = hasPrev ? currentBal - prevBal : null;

    return {
      current: formatValue(currentBal, coinType, hivePerMVests),
      change: changeBal,
      min: formatValue(Number(latest.min_balance.balance), coinType, hivePerMVests),
      max: formatValue(Number(latest.max_balance.balance), coinType, hivePerMVests),
    };
  }, [data, coinType, hivePerMVests]);

  if (!current) {
    return null;
  }

  const changeFormatted = change !== null
    ? formatValue(Math.abs(change), coinType, hivePerMVests)
    : null;
  const isPositive = (change ?? 0) >= 0;

  return (
    <div className="bg-white dark:bg-dark-200 rounded-xl mb-4">
      <div className="p-4 text-sm text-gray-600 dark:text-gray-400">
        {i18next.t("profile-wallet.yearly-summary")}
      </div>
      <div className="px-4 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-lg bg-gray-100 dark:bg-dark-default p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {i18next.t("profile-wallet.current-balance")}
          </div>
          <div className="text-sm font-semibold">{current}</div>
        </div>
        <div className="rounded-lg bg-gray-100 dark:bg-dark-default p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {i18next.t("profile-wallet.year-change")}
          </div>
          <div className={`text-sm font-semibold ${changeFormatted === null ? "" : isPositive ? "text-green-600" : "text-red-500"}`}>
            {changeFormatted === null ? "--" : `${isPositive ? "+" : "-"}${changeFormatted}`}
          </div>
        </div>
        <div className="rounded-lg bg-gray-100 dark:bg-dark-default p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {i18next.t("profile-wallet.year-min")}
          </div>
          <div className="text-sm font-semibold">{min}</div>
        </div>
        <div className="rounded-lg bg-gray-100 dark:bg-dark-default p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {i18next.t("profile-wallet.year-max")}
          </div>
          <div className="text-sm font-semibold">{max}</div>
        </div>
      </div>
    </div>
  );
}
