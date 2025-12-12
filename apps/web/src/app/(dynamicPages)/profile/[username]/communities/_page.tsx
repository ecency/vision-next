"use client";

import { useClientActiveUser } from "@/api/queries";
import { CommunityListItem } from "@/app/_components";
import { useCommunitiesCache } from "@/core/caches";
import { Account } from "@/entities";
import { LinearProgress } from "@/features/shared";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  MenuItem
} from "@/features/ui/dropdown";
import { getAccountFullQueryOptions, getAccountSubscriptionsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilClock, UilSort, UilUser } from "@tooni/iconscout-unicons-react";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export function ProfileCommunities() {
  const params = useParams();
  const activeUser = useClientActiveUser();

  const [sort, setSort] = useState<"asc" | "desc">("asc");
  const label = useMemo(
    () =>
      sort ? i18next.t("sort-trending-tags.ascending") : i18next.t("sort-trending-tags.descending"),
    [sort]
  );

  const dropDownItems: MenuItem[] = [
    {
      label: <span id="ascending">{i18next.t("sort-trending-tags.ascending")}</span>,
      onClick: () => setSort("asc")
    },
    {
      label: <span id="descending">{i18next.t("sort-trending-tags.descending")}</span>,
      onClick: () => setSort("desc")
    }
  ];

  const { data: account } = useQuery(
    getAccountFullQueryOptions((params.username as string).replace("%40", ""))
  );
  const { data, isFetching } = useQuery(getAccountSubscriptionsQueryOptions(account?.name));
  const communities = useCommunitiesCache(data?.map((item) => item[0]) ?? []);

  const items = useMemo(
    () =>
      data?.sort((a, b) => {
        if (a[1] > b[1]) return sort === "asc" ? 1 : -1;
        if (a[1] < b[1]) return sort === "asc" ? -1 : 1;
        return 0;
      }) ?? [],
    [data, sort]
  );

  return (
    <div>
      {isFetching && <LinearProgress />}

      <div className="flex items-center justify-between -mt-12 mb-8">
        <div />
        {items.length >= 3 && (
          <Dropdown className="-mt-2.5">
            <DropdownToggle>
              <Button size="sm" appearance="gray-link" icon={<UilSort />}>
                {label}
              </Button>
            </DropdownToggle>
            <DropdownMenu align="right">
              {dropDownItems.map((item, i) => (
                <DropdownItem key={i} onClick={item.onClick}>
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        )}
      </div>
      {!isFetching && items?.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="py-4"
        >
          <div className="px-2 py-4 sm:px-4 md:p-6 lg:p-12 bg-white rounded-2xl flex flex-col gap-4 md:gap-8 lg:gap-12 xl:gap-16 items-center">
            <div className="flex flex-col items-center justify-center gap-2">
              <UilClock className="text-blue-dark-sky w-12 h-12" />
              <div className="text-xl font-bold">{i18next.t("profile.empty-communities")}</div>
              {activeUser?.username === account?.name && (
                <div className="text-gray-600 dark:text-gray-400 text-center max-w-[500px]">
                  {i18next.t("profile.empty-communities-hint")}
                </div>
              )}
            </div>

            {activeUser?.username === account?.name && (
              <div className="flex justify-center gap-4">
                <Link href="/communities/create">
                  <Button size="sm">{i18next.t("profile.create-community")}</Button>
                </Link>
                <Link href="/communities">
                  <Button appearance="gray" size="sm">
                    {i18next.t("profile.section-communities")}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
                  className=" bg-white/80 rounded-2xl p-2 xl:p-3 flex flex-col gap-2 xl:gap-3 justify-between"
                >
                  <CommunityListItem
                    small={true}
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
    </div>
  );
}
