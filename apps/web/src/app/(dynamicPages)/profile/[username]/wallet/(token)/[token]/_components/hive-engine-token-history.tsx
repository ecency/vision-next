"use client";

import { ProfileLink, UserAvatar } from "@/features/shared";
import { Badge } from "@/features/ui";
import { useInfiniteDataFlow } from "@/utils";
import { EcencyRenderer } from "@/features/post-renderer";
import { getHiveEngineTokenTransactionsQueryOptions } from "@ecency/wallets";
import { useInfiniteQuery } from "@tanstack/react-query";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import { useParams } from "next/navigation";
import { memo } from "react";
import {
  ProfileWalletTokenHistoryCard,
  ProfileWalletTokenHistoryHiveItem
} from "../../_components";
import {
  DEFAULT_HIVE_ENGINE_OPERATION_ICON,
  HiveEngineOperationIcon
} from "../_consts";

const MemoEcencyRenderer = memo(EcencyRenderer);

export function HiveEngineTokenHistory() {
  const { token, username } = useParams();

  const cleanUsername = (username as string).replace("%40", "");
  const tokenSymbol = (token as string).toUpperCase();

  const { data } = useInfiniteQuery(
    getHiveEngineTokenTransactionsQueryOptions(cleanUsername, tokenSymbol)
  );
  const dataFlow = useInfiniteDataFlow(data);

  return (
    <ProfileWalletTokenHistoryCard>
      {dataFlow.map((transaction, index) => {
        const {
          _id,
          operation,
          timestamp,
          quantity,
          from,
          to,
          authorperm,
        } = transaction;

        return (
          <ProfileWalletTokenHistoryHiveItem
            key={
              _id ||
              `${operation}-${timestamp}-${quantity}-${from ?? ""}-${to ?? ""}-${
                authorperm ?? ""
              }-${index}`
            }
            icon={
              HiveEngineOperationIcon[operation] ?? DEFAULT_HIVE_ENGINE_OPERATION_ICON
            }
            type={operation}
            timestamp={timestamp * 1000}
            numbers={quantity}
            rawDetails={transaction}
          >
            {operation === "tokens_transfer" && (
              <div className="flex gap-2 items-center">
                <ProfileLink username={from}>
                  <Badge className="flex gap-1 pl-0.5 items-center">
                    <UserAvatar username={from} size="small" />
                    {from}
                  </Badge>
                </ProfileLink>
                <UilArrowRight className="text-gray-400 dark:text-gray-600" />
                <ProfileLink username={to}>
                  <Badge className="flex gap-1 pl-0.5 items-center">
                    <UserAvatar username={to} size="small" />
                    {to}
                  </Badge>
                </ProfileLink>
              </div>
            )}
            {[
              "comments_authorReward",
              "comments_curationReward",
              "comments_authorReward_stake",
              "comments_curationReward_stake"
            ].includes(operation) && (
              <MemoEcencyRenderer value={`https://ecency.com/${authorperm}`} />
            )}
          </ProfileWalletTokenHistoryHiveItem>
        );
      })}
    </ProfileWalletTokenHistoryCard>
  );
}
