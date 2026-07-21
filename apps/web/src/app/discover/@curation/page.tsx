"use client";

import {
  UsersTableListItem,
  UsersTableListLayout,
  UserTableListHeader
} from "@/app/discover/_components";
import { LeaderBoardDuration } from "@/entities";
import { EcencyConfigManager } from "@/config";
import { getDiscoverCurationQueryOptions } from "@ecency/sdk";
import { dehydrate, HydrationBoundary, useQuery } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import i18next from "i18next";
import { Tooltip } from "@ui/tooltip";
import { formattedNumber } from "@/utils";
import React from "react";
import { Badge } from "@ui/badge";
import { UilInfoCircle } from "@tooni/iconscout-unicons-react";
import { useSearchParams } from "next/navigation";

export default function CurationPage() {
  const params = useSearchParams();

  const { data } = useQuery(
    getDiscoverCurationQueryOptions((params.get("period") as LeaderBoardDuration) ?? "day")
  );

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
                <UilInfoCircle className="size-4" />
                <span className="score">{i18next.t("leaderboard.header-votes")}</span>
              </div>
            </Tooltip>
          </UserTableListHeader>
          {data && data.length > 0 && (
            <div className="flex flex-col gap-4">
              {data.map((r, i) => (
                <UsersTableListItem username={r.account} i={i} key={i}>
                  <div className="text-blue-dark-sky text-sm font-semibold">
                    {/* `vests` already holds HP — esync converts VESTS→HP at ingest.
                        Do not run vestsToHp() here or the value is double-converted. */}
                    {formattedNumber(r.vests, { suffix: "HP" })}
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
