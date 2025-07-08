"use client";

import { CommunityListItem, CommunityListItemLoading } from "@/app/_components";
import { getCommunityCache } from "@/core/caches";
import { Community } from "@/entities";
import { Button } from "@/features/ui";
import { getCommunitiesQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import Link from "next/link";
import { Fragment, useMemo } from "react";

export const TopCommunitiesWidget = () => {
  const { data: ecencyCommunity } = getCommunityCache("hive-125125").useClientQuery();
  const { data, isLoading: loading } = useQuery(getCommunitiesQueryOptions("rank"));

  const list = useMemo(() => {
    if (!data || !ecencyCommunity) {
      return [];
    }

    const result: Community[] = [];
    while (result.length < 5) {
      const index = Math.floor(Math.random() * (data.length - 1));
      if (result.every((item) => data[index].id !== item.id)) {
        result.push(data[index]);
      }
    }
    if (ecencyCommunity) {
      return [ecencyCommunity, ...result.slice(0, result.length - 1)];
    }

    return result;
  }, [ecencyCommunity, data]);

  return (
    <div className="mt-4">
      <div className="font-semibold">{i18next.t("top-communities.title")}</div>
      <div className="flex flex-col">
        {list.length === 0 && !loading && (
          <div className="no-results">{i18next.t("communities.no-results")}</div>
        )}
        {list.map((x, i) => (
          <Fragment key={i}>
            <CommunityListItem community={x} small={true} />
          </Fragment>
        ))}
        {loading &&
          new Array(5).fill(1).map((_, i) => <CommunityListItemLoading small={true} key={i} />)}
      </div>
      <Link href="/communities/create" className="mt-4 block">
        <Button full={true} size="sm" appearance="gray">
          {i18next.t("top-communities.create-button")}
        </Button>
      </Link>
    </div>
  );
};
