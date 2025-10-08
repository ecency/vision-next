"use client";

import {
  UsersTableListItem,
  UsersTableListLayout,
  UserTableListHeader
} from "@/app/discover/_components";
import { LeaderBoardDuration } from "@/entities";
import { EcencyConfigManager } from "@/config";
import { getDiscoverCurationQuery, getDynamicPropsQuery } from "@/api/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import i18next from "i18next";
import { Tooltip } from "@ui/tooltip";
import { formattedNumber, vestsToHp } from "@/utils";
import React from "react";
import { Badge } from "@ui/badge";
import { UilInfoCircle } from "@tooni/iconscout-unicons-react";
import { useSearchParams } from "next/navigation";

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default function CurationPage({ searchParams }: Props) {
  const params = useSearchParams();

  const { data: dynamicProps } = getDynamicPropsQuery().useClientQuery();
  const { data } = getDiscoverCurationQuery(
    (params.get("period") as LeaderBoardDuration) ?? "day"
  ).useClientQuery();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.discover.curation.enabled}
      >
        <UsersTableListLayout>
          <div className="flex justify-between items-center">
            <div className="font-semibold">{i18next.t("leaderboard.title-curators")}</div>
            <div className="text-sm opacity-50">
              {i18next.t(`leaderboard.title-${params.get("period") ?? "day"}`)}
            </div>
          </div>
          <UserTableListHeader>
            <span className="text-sm opacity-50">{i18next.t("leaderboard.header-reward")}</span>
            <Tooltip content={i18next.t("leaderboard.header-votes-tip")}>
              <div className="text-sm opacity-50 flex items-center gap-1">
                <UilInfoCircle className="w-4 h-4" />
                <span className="score">{i18next.t("leaderboard.header-votes")}</span>
              </div>
            </Tooltip>
          </UserTableListHeader>
          {data && data.length > 0 && (
            <div className="flex flex-col gap-4">
              {data.map((r, i) => (
                <UsersTableListItem username={r.account} i={i} key={i}>
                  <div className="text-blue-dark-sky text-sm font-semibold">
                    {formattedNumber(vestsToHp(r.vests, dynamicProps?.hivePerMVests ?? 1), {
                      suffix: "HP"
                    })}
                  </div>
                  <Badge>{r.votes}</Badge>
                </UsersTableListItem>
              ))}
            </div>
          )}
        </UsersTableListLayout>
      </EcencyConfigManager.Conditional>
    </HydrationBoundary>
  );
}
