"use client";
import { CommunityListItem } from "@/app/_components";
import { useCommunitiesCache } from "@/core/caches";
import { useGlobalStore } from "@/core/global-store";
import { Account } from "@/entities";
import { LinearProgress } from "@/features/shared";
import { getAccountSubscriptionsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilUser } from "@tooni/iconscout-unicons-react";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SortCommunities } from "../sort-profile-communities";

interface Props {
  account: Account;
}

export function ProfileCommunities({ account }: Props) {
  const activeUser = useGlobalStore((s) => s.activeUser);

  const [sort, setSort] = useState<"asc" | "desc">("asc");

  const { data, isFetching } = useQuery(getAccountSubscriptionsQueryOptions(account.name));
  const communities = useCommunitiesCache(data?.map((item) => item[0]) ?? []);

  const showCreateLink = activeUser && activeUser.username === account.name;
  const items = useMemo(
    () =>
      data?.sort((a, b) => {
        if (a[1] > b[1]) return sort === "asc" ? 1 : -1;
        if (a[1] < b[1]) return sort === "asc" ? -1 : 1;
        return 0;
      }),
    [data, sort]
  );

  return (
    <div className="mt-4">
      {isFetching && <LinearProgress />}
      {!isFetching && items?.length === 0 && (
        <>
          <h2>{i18next.t("profile.communities-title")}</h2>
          <p className="text-gray-600">{i18next.t("g.empty-list")}</p>
          {showCreateLink && (
            <p>
              <Link href="/communities/create" className="create-link">
                {i18next.t("profile.create-community")}
              </Link>
            </p>
          )}
        </>
      )}
      {items && items.length > 0 && (
        <>
          <div className="flex items-center justify-between my-4 lg:mt-8">
            <h2 className="text-xl font-bold">{i18next.t("profile.communities-title")}</h2>

            {items.length >= 3 && (
              <SortCommunities
                sort={sort}
                sortCommunitiesInAsc={() => setSort("asc")}
                sortCommunitiesInDsc={() => setSort("desc")}
              />
            )}
          </div>
          {showCreateLink && (
            <p>
              <Link href="/communities/create" className="mb-4 flex">
                <Button outline={true} icon={<UilUser />}>
                  {i18next.t("profile.create-community")}
                </Button>
              </Link>
            </p>
          )}

          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {items.map(
                (i, k) =>
                  communities.find((c) => c.data?.name === i[0])?.data && (
                    <motion.div
                      initial={{ opacity: 0, y: -48 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -48 }}
                      transition={{ delay: k * 0.2 }}
                      key={k}
                      className="border border-[--border-color] rounded-2xl p-2 xl:p-3 flex flex-col gap-2 xl:gap-3"
                    >
                      <CommunityListItem
                        vertical={true}
                        community={communities.find((c) => c.data?.name === i[0])?.data!}
                      />
                      <div>
                        <Badge>{i[2]}</Badge>
                      </div>
                    </motion.div>
                  )
              )}
            </AnimatePresence>
          </ul>
        </>
      )}
    </div>
  );
}
