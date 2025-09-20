"use client";

import { useInfiniteDataFlow } from "@/utils";
import { getHiveAssetTransactionsQueryOptions } from "@ecency/wallets";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMount } from "react-use";
import { ProfileWalletTokenHistoryCard } from "../_components";
import { HiveChart, HiveTransactionRow } from "./_components";
import { FormControl } from "@/features/ui";
import i18next from "i18next";

const OPTIONS = ["rewards", "transfers", "stake-operations", "market-orders", "interests"].map(
  (value) => ({
    value,
    label: i18next.t(`transactions.group-${value}`)
  })
);

export function HivePage() {
  const { username } = useParams();

  const [type, setType] = useState("transfers");

  const { data, refetch } = useInfiniteQuery(
    getHiveAssetTransactionsQueryOptions((username as string).replace("%40", ""), 20, type as any)
  );
  const dataFlow = useInfiniteDataFlow(data);

  const uniqueTransactionsList = useMemo(
    () => Array.from(new Map(dataFlow.map((item) => [item["num"], item])).values()),
    [dataFlow]
  );

  useMount(() => refetch());

  return (
    <>
      <HiveChart />
      <ProfileWalletTokenHistoryCard
        action={
          <FormControl
            value={type}
            onChange={(e) => setType((e.target as any).value)}
            type="select"
          >
            {OPTIONS.map(({ label, value }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FormControl>
        }
      >
        {uniqueTransactionsList.map((item, i) => (
          <HiveTransactionRow transaction={item} key={i} />
        ))}
      </ProfileWalletTokenHistoryCard>
    </>
  );
}
