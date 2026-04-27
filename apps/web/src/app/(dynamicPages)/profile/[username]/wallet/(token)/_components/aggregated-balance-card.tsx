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
    const prevBal = prev ? Number(prev.balance.balance) : 0;
    const changeBal = currentBal - prevBal;

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

  const changeFormatted = formatValue(
    Math.abs(change ?? 0),
    coinType,
    hivePerMVests
  );
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
          <div className={`text-sm font-semibold ${isPositive ? "text-green-600" : "text-red-500"}`}>
            {isPositive ? "+" : "-"}{changeFormatted}
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
