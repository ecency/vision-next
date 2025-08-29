"use client";

import { useInfiniteDataFlow } from "@/utils";
import { getHivePowerAssetTransactionsQueryOptions } from "@ecency/wallets";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useMount } from "react-use";
import { ProfileWalletTokenHistoryCard } from "../_components";
import { HiveChart } from "../hive/_components";
import { HiveTransactionRow, HpAboutCard, HpDelegationsCard } from "./_components";

export function HpPage() {
  const { username } = useParams();
  const cleanUsername = (username as string).replace("%40", "");

  const { data, refetch } = useInfiniteQuery(
    getHivePowerAssetTransactionsQueryOptions(cleanUsername, 20, "")
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
      <ProfileWalletTokenHistoryCard>
        {uniqueTransactionsList.map((item, i) => (
          <HiveTransactionRow transaction={item} key={i} />
        ))}
      </ProfileWalletTokenHistoryCard>
    </>
  );
}
