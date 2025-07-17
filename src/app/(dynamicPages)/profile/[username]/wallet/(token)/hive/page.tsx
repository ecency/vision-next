"use client";

import { useInfiniteDataFlow } from "@/utils";
import { getHiveAssetTransactionsQueryOptions } from "@ecency/wallets";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useMount } from "react-use";
import { ProfileWalletTokenHistoryCard } from "../_components";
import { HiveTransactionRow } from "./_components";

export default function Page() {
  const { username } = useParams();
  const { data, refetch } = useInfiniteQuery(
    getHiveAssetTransactionsQueryOptions((username as string).replace("%40", ""), 20, "transfers")
  );
  const dataFlow = useInfiniteDataFlow(data);

  const uniqueTransactionsList = useMemo(
    () => Array.from(new Map(dataFlow.map((item) => [item["num"], item])).values()),
    [dataFlow]
  );

  useMount(() => refetch());

  return (
    <ProfileWalletTokenHistoryCard>
      {uniqueTransactionsList.map((item, i) => (
        <HiveTransactionRow transaction={item} key={i} />
      ))}
    </ProfileWalletTokenHistoryCard>
  );
}
