"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Community } from "@/entities";
import { EntryFilter } from "@/enums";
import Link from "next/link";
import { DropdownItem } from "@ui/dropdown";
import i18next from "i18next";
import { ListStyleToggle } from "@/features/shared";
import { PageMenu, PageMenuItems, PageMenuLink, PageMenuMobileDropdown } from "@ui/page-menu";
import { usePathname } from "next/navigation";

interface Props {
  community: Community;
}

export const CommunityMenu = (props: Props) => {
  const [menuItems, setMenuItems] = useState([
    EntryFilter.trending,
    EntryFilter.hot,
    EntryFilter.created,
    EntryFilter.payout,
    EntryFilter.muted
  ]);
  const [label, setLabel] = useState<string>(EntryFilter.hot);

  const pathname = usePathname();
  const filter = useMemo(() => pathname?.split("/")[1], [pathname]);

  useEffect(() => {
    let newLabel: string | undefined;

    if (filter === EntryFilter.trending) {
      newLabel = i18next.t("community.posts");
    } else if (menuItems.some((item) => item === filter)) {
      newLabel = i18next.t(`entry-filter.filter-${filter}`);
    } else if (label && !newLabel) {
      newLabel = label;
    } else {
      newLabel = i18next.t(`entry-filter.filter-${menuItems[0]}`);
    }
    setLabel(newLabel);
  }, [filter, label, menuItems]);

  const isFilterInItems = () => menuItems.some((item) => filter === item);

  return (
    <PageMenu className="pb-4 pt-4 md:pt-0">
      <PageMenuMobileDropdown isSelected={isFilterInItems()} label={label}>
        {menuItems.map((x) => (
            <DropdownItem
                key={x}
                href={`/${x}/${props.community.name}`}
                selected={filter === x}
            >
              {i18next.t(`entry-filter.filter-${x}`)}
            </DropdownItem>
        ))}
      </PageMenuMobileDropdown>
      <PageMenuItems>
        {menuItems
          .map((x) => ({
            label: i18next.t(`entry-filter.filter-${x}`),
            href: `/${x}/${props.community.name}`,
            selected: filter === x
          }))
          .map((menuItem) => (
            <PageMenuLink
              label={menuItem.label}
              isSelected={menuItem.selected}
              href={menuItem.href!}
              key={`community-menu-item-${menuItem.label}`}
            />
          ))}
        <PageMenuLink
          href={`/subscribers/${props.community.name}`}
          isSelected={filter === "subscribers"}
          label={i18next.t("community.subscribers")}
        />
        <PageMenuLink
          href={`/activities/${props.community.name}`}
          isSelected={filter === "activities"}
          label={i18next.t("community.activities")}
        />
      </PageMenuItems>
      <div className="menu-items">
        <div className="hidden lg:flex items-center"></div>
      </div>
      {/*@ts-ignore*/}
      {EntryFilter[filter!] && <ListStyleToggle float="right" />}
    </PageMenu>
  );
};
