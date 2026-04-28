"use client";

import {
  getAggregatedBalanceQueryOptions,
  getDynamicPropsQueryOptions,
  vestsToHp,
  type BalanceAggregationGranularity,
  type BalanceCoinType,
} from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useMemo, useState } from "react";
import { formattedNumber } from "@/utils";
import { FormControl } from "@ui/input";
import dayjs from "@/utils/dayjs";

interface Props {
  username: string;
  coinType: BalanceCoinType;
}

const GRANULARITIES: BalanceAggregationGranularity[] = ["yearly", "monthly", "daily"];

const SUMMARY_TITLE_KEY: Record<BalanceAggregationGranularity, string> = {
  yearly: "profile-wallet.yearly-summary",
  monthly: "profile-wallet.monthly-summary",
  daily: "profile-wallet.daily-summary",
};

const CHANGE_LABEL_KEY: Record<BalanceAggregationGranularity, string> = {
  yearly: "profile-wallet.year-change",
  monthly: "profile-wallet.month-change",
  daily: "profile-wallet.day-change",
};

const MIN_LABEL_KEY: Record<BalanceAggregationGranularity, string> = {
  yearly: "profile-wallet.year-min",
  monthly: "profile-wallet.month-min",
  daily: "profile-wallet.day-min",
};

const MAX_LABEL_KEY: Record<BalanceAggregationGranularity, string> = {
  yearly: "profile-wallet.year-max",
  monthly: "profile-wallet.month-max",
  daily: "profile-wallet.day-max",
};

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

function formatPeriodLabel(
  date: string,
  granularity: BalanceAggregationGranularity,
  isLatest: boolean
): string {
  if (isLatest) {
    return i18next.t("g.now") || "Now";
  }
  const d = dayjs(date);
  if (!d.isValid()) {
    return date;
  }
  switch (granularity) {
    case "yearly":
      return d.format("YYYY");
    case "monthly":
      return d.format("MMM YYYY");
    case "daily":
      return d.format("DD MMM YYYY");
  }
}

export function AggregatedBalanceCard({ username, coinType }: Props) {
  const [granularity, setGranularity] =
    useState<BalanceAggregationGranularity>("yearly");
  // Index 0 is "now"; index 1 is the most-recent completed period; subsequent
  // indices walk further back in time. Reset whenever granularity changes
  // because the period list shape differs across granularities.
  const [periodIndex, setPeriodIndex] = useState(1);

  const { data } = useQuery(
    getAggregatedBalanceQueryOptions(username, coinType, granularity)
  );
  const { data: dynamicProps } = useQuery(getDynamicPropsQueryOptions());
  const hivePerMVests = dynamicProps?.hivePerMVests ?? 0;

  const periods = useMemo(() => data ?? [], [data]);

  // Clamp the period index whenever the dataset shape changes so we never
  // index past the end of the list (e.g., switching yearly → daily).
  const safePeriodIndex = Math.min(periodIndex, Math.max(periods.length - 1, 0));

  const { current, change, min, max } = useMemo(() => {
    if (!periods.length) {
      return { current: null, change: null, min: null, max: null };
    }

    const selected = periods[safePeriodIndex];
    if (!selected) {
      return { current: null, change: null, min: null, max: null };
    }

    const next = periods[safePeriodIndex + 1];

    const currentBal = Number(selected.balance.balance);
    const prevBal = next
      ? Number(next.balance.balance)
      : Number(selected.prev_balance?.balance ?? 0);
    const hasPrev = !!next || !!selected.prev_balance?.balance;
    const changeBal = hasPrev ? currentBal - prevBal : null;

    return {
      current: formatValue(currentBal, coinType, hivePerMVests),
      change: changeBal,
      min: formatValue(Number(selected.min_balance.balance), coinType, hivePerMVests),
      max: formatValue(Number(selected.max_balance.balance), coinType, hivePerMVests),
    };
  }, [periods, safePeriodIndex, coinType, hivePerMVests]);

  if (!current) {
    return null;
  }

  const changeFormatted =
    change !== null ? formatValue(Math.abs(change), coinType, hivePerMVests) : null;
  const isPositive = (change ?? 0) >= 0;

  const handleGranularityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGranularity(e.target.value as BalanceAggregationGranularity);
    setPeriodIndex(1);
  };

  return (
    <div className="bg-white dark:bg-dark-200 rounded-xl mb-4">
      <div className="p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {i18next.t(SUMMARY_TITLE_KEY[granularity])}
        </div>
        <div className="flex items-center gap-2">
          <FormControl
            full={false}
            type="select"
            size="xs"
            value={granularity}
            onChange={handleGranularityChange}
          >
            {GRANULARITIES.map((g) => (
              <option key={g} value={g}>
                {i18next.t(`profile-wallet.granularity-${g}`)}
              </option>
            ))}
          </FormControl>
          {periods.length > 1 && (
            <FormControl
              full={false}
              type="select"
              size="xs"
              value={safePeriodIndex}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPeriodIndex(Number(e.target.value))
              }
            >
              {periods.map((p, idx) => (
                <option key={`${p.date}-${idx}`} value={idx}>
                  {formatPeriodLabel(p.date, granularity, idx === 0)}
                </option>
              ))}
            </FormControl>
          )}
        </div>
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
            {i18next.t(CHANGE_LABEL_KEY[granularity])}
          </div>
          <div
            className={`text-sm font-semibold ${
              changeFormatted === null
                ? ""
                : isPositive
                  ? "text-green-600"
                  : "text-red-500"
            }`}
          >
            {changeFormatted === null
              ? "--"
              : `${isPositive ? "+" : "-"}${changeFormatted}`}
          </div>
        </div>
        <div className="rounded-lg bg-gray-100 dark:bg-dark-default p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {i18next.t(MIN_LABEL_KEY[granularity])}
          </div>
          <div className="text-sm font-semibold">{min}</div>
        </div>
        <div className="rounded-lg bg-gray-100 dark:bg-dark-default p-3">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {i18next.t(MAX_LABEL_KEY[granularity])}
          </div>
          <div className="text-sm font-semibold">{max}</div>
        </div>
      </div>
    </div>
  );
}
