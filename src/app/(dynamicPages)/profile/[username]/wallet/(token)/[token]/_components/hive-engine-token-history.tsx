"use client";

import { ProfileLink, UserAvatar } from "@/features/shared";
import { Badge } from "@/features/ui";
import { useInfiniteDataFlow } from "@/utils";
import { EcencyRenderer } from "@ecency/renderer";
import { getHiveEngineTokenTransactionsQueryOptions } from "@/features/wallet/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";
import { useParams } from "next/navigation";
import { memo } from "react";
import {
  ProfileWalletTokenHistoryCard,
  ProfileWalletTokenHistoryHiveItem
} from "../../_components";
import { HiveEngineOperationIcon } from "../_consts";

const MemoEcencyRenderer = memo(EcencyRenderer);

export function HiveEngineTokenHistory() {
  const { token, username } = useParams();

  const { data } = useInfiniteQuery(
    getHiveEngineTokenTransactionsQueryOptions(
      (username as string).replace("%40", ""),
      (token as string).toUpperCase()
    )
  );
  const dataFlow = useInfiniteDataFlow(data);

  return (
    <ProfileWalletTokenHistoryCard>
      {dataFlow.map(({ _id, operation, timestamp, quantity, from, to, authorperm }) => (
        <ProfileWalletTokenHistoryHiveItem
          key={_id}
          icon={HiveEngineOperationIcon[operation]}
          type={operation}
          timestamp={timestamp * 1000}
          numbers={quantity}
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
              <ProfileLink username={from}>
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
      ))}
    </ProfileWalletTokenHistoryCard>
  );
}
