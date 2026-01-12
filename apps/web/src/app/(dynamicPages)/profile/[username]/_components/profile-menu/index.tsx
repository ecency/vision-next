"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import React, { useMemo } from "react";
import { ListStyleToggle } from "@/features/shared";
import { ProfileFilter } from "@/enums";
import i18next from "i18next";
import { kebabMenuHorizontalSvg } from "@ui/svg";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { Button } from "@ui/button";
import { PageMenu, PageMenuItems, PageMenuLink, PageMenuMobileDropdown } from "@ui/index";
import { EcencyConfigManager } from "@/config";
import { usePathname } from "next/navigation";

interface Props {
  username: string;
}

export function ProfileMenu({ username }: Props) {
  const { activeUser } = useActiveAccount();
  const pathname = usePathname();
  const section = useMemo(() => pathname?.split("/")[2] ?? "posts", [pathname]);

  const kebabMenuItems = [
    ...["trail", "replies"]
      .map((x) => ({
        label: i18next.t(`profile.section-${x}`),
        href: `/@${username}/${x}`,
        selected: section === x,
        id: x
      }))
      .filter((item) => !item.selected),
    ...EcencyConfigManager.composeConditionals(
      EcencyConfigManager.withConditional(
        (config) => config.visionFeatures.referrals.enabled,
        () => ({
          label: i18next.t("profile.referrals"),
          href: `/@${username}/referrals`,
          selected: section === "referrals",
          id: "referrals"
        })
      )
    )
  ];

  const menuItems = [
    ...[ProfileFilter.blog, ProfileFilter.posts, ProfileFilter.comments, "communities"].map(
      (x) => ({
        label: i18next.t(`profile.section-${x}`),
        href: `/@${username}/${x}`,
        selected: section === x,
        id: x
      })
    ),
    {
      label: i18next.t(`profile.section-wallet`),
      selected: ["wallet", "points", "engine", "spk"].includes(section),
      href: `/@${username}/wallet`,
      id: "wallet"
    },
    ...(activeUser && activeUser.username === username
      ? [
          {
            label: i18next.t(`profile.section-insights`, { defaultValue: "Insights" }),
            selected: section === "insights",
            href: `/@${username}/insights`,
            id: "insights"
          }
        ]
      : [])
  ];

  const dropDownMenuItems = [...menuItems, ...kebabMenuItems];

  return (
    <PageMenu className="pb-4 pt-4 md:pt-0">
      <PageMenuMobileDropdown
        label={
          dropDownMenuItems.filter((item) => item.id === section).length > 0
            ? i18next.t(`profile.section-${section}`)
            : i18next.t(`profile.section-${dropDownMenuItems[0].id}`)
        }
        isSelected={false}
      >
        {dropDownMenuItems.map((item) => (
            <DropdownItem
                href={item.href}
                key={item.id}
                selected={item.selected}
            >
                {item.label}
            </DropdownItem>
        ))}
      </PageMenuMobileDropdown>
      <PageMenuItems>
        {menuItems.map((menuItem) => (
          <PageMenuLink
            href={menuItem.href!}
            key={`profile-menu-item-${menuItem.label}`}
            label={menuItem.label}
            isSelected={menuItem.selected}
          />
        ))}

        {activeUser && activeUser.username === username && (
          <PageMenuLink
            isSelected={section === "settings"}
            href={`/@${username}/settings`}
            label={i18next.t(`profile.section-settings`)}
          />
        )}
        <Dropdown>
          <DropdownToggle>
            <Button
              noPadding={true}
              icon={kebabMenuHorizontalSvg}
              size="sm"
              appearance="gray-link"
            />
          </DropdownToggle>
          <DropdownMenu align="left">
            {kebabMenuItems.map((item) => (
                <DropdownItem
                    href={item.href}
                    key={item.id}
                    selected={item.selected}
                >
                    {item.label}
                </DropdownItem>
            ))}
          </DropdownMenu>
        </Dropdown>
      </PageMenuItems>
      {ProfileFilter[section as ProfileFilter] && <ListStyleToggle float="right" />}
    </PageMenu>
  );
}
