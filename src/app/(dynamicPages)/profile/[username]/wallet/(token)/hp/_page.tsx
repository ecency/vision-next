"use client";

import { useInfiniteDataFlow } from "@/utils";
import { getHivePowerAssetTransactionsQueryOptions, useClaimRewards } from "@ecency/wallets";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useMount } from "react-use";
import { ProfileWalletTokenHistoryCard } from "../_components";
import { HiveTransactionRow } from "./_components";
import { HiveChart } from "../hive/_components";
import i18next from "i18next";
import { Button } from "@/features/ui";
import { UilPlusCircle } from "@tooni/iconscout-unicons-react";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { success } from "@/features/shared";

export function HpPage() {
  const { username } = useParams();
  const cleanUsername = (username as string).replace("%40", "");

  const { data: accountData } = useQuery(getAccountFullQueryOptions(cleanUsername));
  const { data, refetch } = useInfiniteQuery(
    getHivePowerAssetTransactionsQueryOptions(cleanUsername, 20, "")
  );
  const dataFlow = useInfiniteDataFlow(data);

  const uniqueTransactionsList = useMemo(
    () => Array.from(new Map(dataFlow.map((item) => [item["num"], item])).values()),
    [dataFlow]
  );

  const { mutateAsync: claimedRewards, isPending } = useClaimRewards(cleanUsername, () =>
    success(i18next.t("wallet.claim-reward-balance-ok"))
  );

  useMount(() => refetch());

  return (
    <div>
      <div className="mb-4">
        <ProfileWalletTokenHistoryCard title={i18next.t("static.about.page-title")}>
          <div className="px-4 pb-4 text-sm">
            {i18next.t("wallet.hive-power-description")}

            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="opacity-50">{i18next.t("wallet.unclaimed-rewards")}</div>
              <Button
                isLoading={isPending}
                icon={<UilPlusCircle />}
                disabled={accountData?.reward_vesting_hive === "0.000 HIVE"}
                onClick={claimedRewards}
              >
                {accountData?.reward_vesting_hive ?? "0.000 HIVE"}
              </Button>
            </div>
          </div>
        </ProfileWalletTokenHistoryCard>
      </div>
      <HiveChart />
      <ProfileWalletTokenHistoryCard>
        {uniqueTransactionsList.map((item, i) => (
          <HiveTransactionRow transaction={item} key={i} />
        ))}
      </ProfileWalletTokenHistoryCard>
    </div>
  );
}
