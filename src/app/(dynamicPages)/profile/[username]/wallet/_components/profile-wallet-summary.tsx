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
import { TOKEN_COLORS_MAP } from "../_consts";

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
        .map((data) => ({
          asset: data!.name,
          percent: Math.round(
            ((isNaN(data!.accountBalance) ? 0 : data!.accountBalance) *
              (data && isNaN(data.price) ? 0 : data!.price) *
              100) /
              totalBalance
          ),
          usdValue:
            (isNaN(data!.accountBalance) ? 0 : data!.accountBalance) *
            (data && isNaN(data.price) ? 0 : data!.price)
        }))
        .reduce(
          (acc, item) => {
            const otherSection = acc.find(({ asset }) => asset === "Other") ?? {
              asset: "Other",
              percent: 0,
              usdValue: undefined
            };

            if (item.percent < 10) {
              otherSection.percent += item.percent;
            }

            return [
              ...acc.filter(({ asset }) => asset !== "Other"),
              ...(item.percent >= 10 ? [item] : []),
              otherSection
            ];
          },
          [] as { asset: string; percent: number; usdValue: number | undefined }[]
        ),
    [totalBalance, queriesResult]
  );

  return (
    <div className="bg-white rounded-xl p-3 mb-4 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="text-gray-600 dark:text-gray-400 text-sm">Balance</div>
        <div className="text-xl font-bold text-blue-dark-sky">
          {totalBalance ? (
            <FormattedCurrency value={totalBalance} />
          ) : (
            <div className="w-[80px] rounded-lg animate-pulse h-[28px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          )}
        </div>
      </div>
      <div className="flex w-full text-sm text-white rounded-lg overflow-hidden gap-1">
        {assetsParts.length === 0 && (
          <>
            <div className="w-[40%] rounded-lg animate-pulse h-[36px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
            <div className="w-[30%] rounded-lg animate-pulse h-[36px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
            <div className="w-[30%] rounded-lg animate-pulse h-[36px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          </>
        )}
        {assetsParts.map(({ asset, percent, usdValue }) => (
          <motion.div
            className="p-2"
            style={{
              backgroundColor: TOKEN_COLORS_MAP[asset] ?? "#fcc920"
            }}
            initial={{ opacity: 0, width: "0%" }}
            animate={{ opacity: 1, width: `${percent}%` }}
            key={asset}
          >
            {usdValue && `$ ${usdValue.toFixed(2)} – `}
            {asset}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
