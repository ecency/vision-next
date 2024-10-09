import { getCommunitiesQuery } from "@/api/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import React from "react";
import { CommunityCard } from "@/app/discover/@communities/_components/community-card";
import { getCommunityCache } from "@/core/caches";
import { PrimaryCommunityCard } from "@/app/discover/@communities/_components/primary-community-card";
import Link from "next/link";
import i18next from "i18next";
import { UilArrowRight } from "@tooni/iconscout-unicons-react";

export default async function CommunitiesList() {
  const ecencyCommunity = await getCommunityCache("hive-125125").prefetch();
  const communities = await getCommunitiesQuery("hot", "", 5).prefetch();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <div className="py-6 gap-4 overflow-y-auto relative grid grid-cols-12">
        <div className="col-span-12 sm:col-span-4 lg:col-span-3">
          {ecencyCommunity && <PrimaryCommunityCard community={ecencyCommunity} />}
        </div>
        <div className="col-span-12 sm:col-span-8 lg:col-span-9 gap-4 grid grid-cols-12">
          {communities?.map((community, i) => (
            <CommunityCard community={community} i={i + 1} key={community.title} />
          ))}
          <Link
            href="/communities"
            className="hover:border-blue-dark-sky col-span-6 sm:col-span-4 h-full border border-[--border-color] rounded-2xl flex flex-col items-center justify-center p-6 md:p-8 text-center gap-4"
          >
            {i18next.t("discover.view-more-communities")}
            <UilArrowRight className="w-6 h-6" />
          </Link>
        </div>
      </div>
    </HydrationBoundary>
  );
}
