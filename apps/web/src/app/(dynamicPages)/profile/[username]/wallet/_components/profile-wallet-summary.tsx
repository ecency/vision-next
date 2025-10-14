"use client";

import { FormattedCurrency } from "@/features/shared";
import {
  GeneralAssetInfo,
  getAccountWalletAssetInfoQueryOptions,
  getAccountWalletListQueryOptions
} from "@ecency/wallets";
import { useQueries, useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { useMemo } from "react";

import clsx from "clsx";
import { TOKEN_COLORS_MAP } from "@/features/wallet";
import { StyledTooltip } from "@/features/ui";

export function ProfileWalletSummary() {
  const { username } = useParams();
  const { data } = useQuery(
    getAccountWalletListQueryOptions((username as string).replace("%40", ""))
  );
  const queriesResult = useQueries({
    queries: (data ?? []).map((item: string) =>
      getAccountWalletAssetInfoQueryOptions((username as string).replace("%40", ""), item)
    )
  });
  const totalBalance = useMemo(
    () =>
      queriesResult
        .map((query) => query.data as GeneralAssetInfo | undefined)
        .reduce(
          (acc, data) =>
            acc +
            (data
              ? (isNaN(data.accountBalance) ? 0 : data.accountBalance) *
                (data && isNaN(data.price) ? 0 : data.price)
              : 0),
          0
        ),
    [queriesResult]
  );
  const assetsParts = useMemo(
    () =>
      queriesResult
        .map((query) => query.data as GeneralAssetInfo | undefined)
        .filter((data) => data)
        .map((data) => {
          const usdValue =
            (isNaN(data!.accountBalance) ? 0 : data!.accountBalance) *
            (data && isNaN(data.price) ? 0 : data!.price);

          return {
            asset: data!.name,
            percent:
              totalBalance > 0
                ? Math.round((usdValue * 100) / totalBalance)
                : 0,
            usdValue
          };
        })
        .reduce(
          (acc, item) => {
            const otherSection =
              acc.find(({ asset }) => asset === "Other") ?? {
                asset: "Other",
                percent: 0,
                usdValue: 0
              };

            const shouldAggregateToOther =
              item.asset !== "POINTS" && (item.usdValue ?? 0) < 75;

            if (shouldAggregateToOther) {
              otherSection.percent += item.percent;
              otherSection.usdValue += item.usdValue ?? 0;

              return [
                ...acc.filter(({ asset }) => asset !== "Other"),
                otherSection
              ];
            }

            return [
              ...acc.filter(({ asset }) => asset !== "Other"),
              item,
              otherSection
            ];
          },
          [] as { asset: string; percent: number; usdValue: number | undefined }[]
        )
        .filter((item) => item.asset !== "Other" || item.percent > 0),
    [totalBalance, queriesResult]
  );

  return (
    <div className="bg-white rounded-xl p-3 mb-4 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="text-gray-600 dark:text-gray-400 text-sm">Balance</div>
        <div className="text-xl font-bold text-blue-dark-sky">
          {queriesResult.some((q) => q.isPending) ? (
            <div className="w-[80px] rounded-lg animate-pulse h-[28px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          ) : (
            <FormattedCurrency value={totalBalance} />
          )}
        </div>
      </div>
      <div className="flex w-full text-sm text-gray-400 dark:text-white rounded-lg overflow-hidden gap-0.5">
        {assetsParts.length === 0 && (
          <>
            <div className="w-[40%] rounded-lg animate-pulse h-[36px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
            <div className="w-[30%] rounded-lg animate-pulse h-[36px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
            <div className="w-[30%] rounded-lg animate-pulse h-[36px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          </>
        )}
        {assetsParts.length > 1 &&
          assetsParts.map(({ asset, percent, usdValue }) => (
            <StyledTooltip
              style={{ width: `${percent}%` }}
              key={asset}
              content={
                <>
                  {usdValue && `$ ${usdValue.toFixed(2)} – `}
                  {asset}
                </>
              }
            >
              <motion.div
                className={clsx(
                  "p-2",
                  TOKEN_COLORS_MAP[asset] ?? "bg-gradient-to-r from-[#fcc920] to-[#fcc920]/60"
                )}
                initial={{ opacity: 0, width: "0%" }}
                animate={{ opacity: 1, width: "100%" }}
              />
            </StyledTooltip>
          ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {assetsParts.length > 1 &&
          assetsParts.map(({ asset, percent, usdValue }, i) => (
            <motion.div
              className="flex items-center gap-1 text-xs"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
              key={asset}
            >
              <div
                className={clsx(
                  "w-3 h-3 rounded-full",
                  TOKEN_COLORS_MAP[asset] ?? "bg-gradient-to-r from-[#fcc920] to-[#fcc920]/60"
                )}
              />
              {usdValue && `$ ${usdValue.toFixed(2)} – `}
              {asset}
            </motion.div>
          ))}
      </div>
    </div>
  );
}
