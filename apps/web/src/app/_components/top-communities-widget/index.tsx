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
  const { data: ecencyCommunity } = useQuery(getCommunityCache("hive-125125"));
  const { data, isLoading: loading } = useQuery(getCommunitiesQueryOptions("rank"));

  const list = useMemo(() => {
    if (!data || !ecencyCommunity) {
      return [];
    }

    // CSPRNG pick — the picked community flows into URLs and CodeQL treats
    // it as taint when sourced from Math.random.
    const pickIndex = (n: number) => {
      const buf = new Uint32Array(1);
      crypto.getRandomValues(buf);
      return buf[0] % n;
    };

    const result: Community[] = [];
    while (result.length < 5 && result.length < data.length) {
      const index = pickIndex(data.length);
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
      <div className="flex flex-col gap-2 lg:gap-4">
        {list.length === 0 && !loading && (
          <div className="no-results">{i18next.t("communities.no-results")}</div>
        )}
        {list.map((x, i) => (
          <CommunityListItem key={i} community={x} small={true} />
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
