"use client";

import { CommunityListItem } from "@/app/_components";
import { useCommunitiesCache } from "@/core/caches";
import { useGlobalStore } from "@/core/global-store";
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
import { UilSort, UilUser } from "@tooni/iconscout-unicons-react";
import { Badge } from "@ui/badge";
import { Button } from "@ui/button";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

export function ProfileCommunities() {
  const params = useParams();
  const activeUser = useGlobalStore((s) => s.activeUser);

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

  const showCreateLink = activeUser && activeUser.username === account?.name;
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
      {!isFetching && items?.length === 0 && (
        <>
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
      {showCreateLink && (
        <p>
          <Link href="/communities/create" className="mb-4 flex">
            <Button outline={true} icon={<UilUser />}>
              {i18next.t("profile.create-community")}
            </Button>
          </Link>
        </p>
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
