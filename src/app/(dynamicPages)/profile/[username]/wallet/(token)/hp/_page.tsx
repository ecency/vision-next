"use client";

import { useInfiniteDataFlow } from "@/utils";
import { getHivePowerAssetTransactionsQueryOptions } from "@/features/wallet/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMount } from "react-use";
import { ProfileWalletTokenHistoryCard } from "../_components";
import { HiveChart } from "../hive/_components";
import { HiveTransactionRow, HpAboutCard, HpDelegationsCard } from "./_components";
import i18next from "i18next";
import { FormControl } from "@/features/ui";

const OPTIONS = ["rewards", "transfers", "stake-operations", "market-orders", "interests"].map(
  (value) => ({
    value,
    label: i18next.t(`transactions.group-${value}`)
  })
);

export function HpPage() {
  const { username } = useParams();

  const [type, setType] = useState("transfers");

  const cleanUsername = (username as string).replace("%40", "");

  const { data, refetch } = useInfiniteQuery(
    getHivePowerAssetTransactionsQueryOptions(cleanUsername, 20, type as any)
  );
  const dataFlow = useInfiniteDataFlow(data);

  const uniqueTransactionsList = useMemo(
    () => Array.from(new Map(dataFlow.map((item) => [item["num"], item])).values()),
    [dataFlow]
  );

  useMount(() => refetch());

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <HpAboutCard username={cleanUsername} />
        <HpDelegationsCard username={cleanUsername} />
      </div>

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
