"use client";

import { useInfiniteDataFlow } from "@/utils";
import { getHbdAssetTransactionsQueryOptions } from "@ecency/wallets";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMount } from "react-use";
import { ProfileWalletTokenHistoryCard } from "../_components";
import { HiveTransactionRow } from "./_components";
import { Button, FormControl } from "@/features/ui";
import { TradingViewWidget } from "@/features/trading-view";
import i18next from "i18next";
import { UilArrowUpRight } from "@tooni/iconscout-unicons-react";

const OPTIONS = ["rewards", "transfers", "stake-operations", "market-orders", "interests"].map(
  (value) => ({
    value,
    label: i18next.t(`transactions.group-${value}`)
  })
);

export function HbdPage() {
  const { username } = useParams();

  const [type, setType] = useState("transfers");

  const { data, refetch } = useInfiniteQuery(
    getHbdAssetTransactionsQueryOptions((username as string).replace("%40", ""), 1000, type as any)
  );
  const dataFlow = useInfiniteDataFlow(data);

  const uniqueTransactionsList = useMemo(
    () => Array.from(new Map(dataFlow.map((item) => [item["num"], item])).values()),
    [dataFlow]
  );

  const sortedTransactions = useMemo(
    () =>
      [...uniqueTransactionsList].sort(
        (a, b) => Number(b.num) - Number(a.num)
      ),
    [uniqueTransactionsList]
  );

  useMount(() => refetch());

  return (
    <>
      <div className="bg-white rounded-xl mb-4">
        <div className="p-4 flex justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {i18next.t("profile-wallet.market")}
          </div>
          <Button
            href="/market/advanced"
            target="_blank"
            appearance="gray"
            size="sm"
            icon={<UilArrowUpRight />}
          >
            {i18next.t("market-data.trade")}
          </Button>
        </div>
        <div className="px-4 pb-4 h-[300px]">
          <TradingViewWidget symbol="HBD" />
        </div>
      </div>
      <ProfileWalletTokenHistoryCard
        action={
          <FormControl value={type} onChange={(e) => setType((e.target as any).value)} type="select">
            {OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FormControl>
        }
      >
        {sortedTransactions.map((item, i) => (
          <HiveTransactionRow transaction={item} key={i} />
        ))}
      </ProfileWalletTokenHistoryCard>
    </>
  );
}
