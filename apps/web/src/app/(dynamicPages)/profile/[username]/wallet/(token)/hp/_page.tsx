"use client";

import { useInfiniteDataFlow } from "@/utils";
import { getHivePowerAssetTransactionsQueryOptions } from "@ecency/wallets";
import type { HiveOperationGroup } from "@ecency/wallets";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useMount } from "react-use";
import { ProfileWalletTokenHistoryCard } from "../_components";
import { HiveTransactionRow, HpAboutCard, HpDelegationsCard } from "./_components";
import i18next from "i18next";
import { Button, FormControl } from "@/features/ui";
import { TradingViewWidget } from "@/features/trading-view";
import { UilArrowUpRight } from "@tooni/iconscout-unicons-react";

const OPTIONS = [
  {
    value: "rewards-stake",
    label: `${i18next.t("transactions.group-rewards")} & ${i18next.t("transactions.group-stake-operations")}`,
  },
  "rewards",
  "transfers",
  "stake-operations",
  "market-orders",
  "interests",
].map((value) =>
  typeof value === "string"
    ? { value, label: i18next.t(`transactions.group-${value}`) }
    : value
);

const REWARD_TYPES = new Set([
  "author_reward",
  "comment_benefactor_reward",
  "curation_reward",
  "producer_reward",
  "claim_reward_balance",
]);

const STAKE_OPERATION_TYPES = new Set([
  "withdraw_vesting",
  "transfer_to_vesting",
  "delegate_vesting_shares",
  "fill_vesting_withdraw",
  "return_vesting_delegation",
  "set_withdraw_vesting_route",
]);

type HpFilter = "rewards-stake" | HiveOperationGroup;

export function HpPage() {
  const { username } = useParams();

  const [type, setType] = useState<HpFilter>("rewards-stake");

  const cleanUsername = (username as string).replace("%40", "");

  const queryGroup: HiveOperationGroup = type === "rewards-stake" ? "" : type;

  const { data, refetch } = useInfiniteQuery(
    getHivePowerAssetTransactionsQueryOptions(
      cleanUsername,
      1000,
      queryGroup
    )
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

  const filteredTransactions = useMemo(() => {
    if (type !== "rewards-stake") {
      return sortedTransactions;
    }

    return sortedTransactions.filter((item) =>
      REWARD_TYPES.has(item.type) || STAKE_OPERATION_TYPES.has(item.type)
    );
  }, [type, sortedTransactions]);

  useMount(() => refetch());

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <HpAboutCard username={cleanUsername} />
        <HpDelegationsCard username={cleanUsername} />
      </div>

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
          <TradingViewWidget symbol="HIVE" />
        </div>
      </div>
      <ProfileWalletTokenHistoryCard
        action={
          <FormControl
            value={type}
            onChange={(e) => setType((e.target as any).value as HpFilter)}
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
        {filteredTransactions.map((item, i) => (
          <HiveTransactionRow transaction={item} key={i} />
        ))}
      </ProfileWalletTokenHistoryCard>
    </>
  );
}
