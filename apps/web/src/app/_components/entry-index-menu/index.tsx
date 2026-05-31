"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import React, { useCallback, useEffect, useMemo } from "react";
import "./_index.scss";
import { kebabMenuHorizontalSvg, menuDownSvg } from "@ui/svg";
import Link from "next/link";
import i18next from "i18next";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import usePrevious from "react-use/lib/usePrevious";
import { Button } from "@ui/button";
import { classNameObject } from "@ui/util";
import { FeedMenuItem, useFeedMenu } from "@/app/_components/entry-index-menu/use-feed-menu";

const PILL_CLASS =
  "text-gray-steel hover:text-blue-dark-sky rounded-full flex items-center px-3 py-1.5";
const PILL_SELECTED_CLASS = "bg-blue-dark-sky text-white hover:text-white";

export function EntryIndexMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { activeUser } = useActiveAccount();
  const prevActiveUser = usePrevious(activeUser);

  const { sources, sorts, overflow, isFollowing } = useFeedMenu();

  const noReblog = useMemo(() => searchParams?.get("no-reblog") === "true", [searchParams]);

  // Show the source group whenever there's a real choice: logged-in users get
  // Following/Communities/Global, and anyone browsing a #hashtag gets the tag
  // chip + Global. A lone Global (logged-out, no tag) is implied, so it's hidden.
  const showSources = sources.length > 1;
  const selectedSource = useMemo(
    () => sources.find((s) => s.selected) ?? sources[sources.length - 1],
    [sources]
  );
  const selectedSort = useMemo(() => sorts.find((s) => s.selected), [sorts]);

  const reblogLabel = noReblog
    ? i18next.t("entry-filter.filter-with-reblog")
    : i18next.t("entry-filter.filter-no-reblog");

  // Logged-out users can't view a community ("/my") feed — fall back to global.
  useEffect(() => {
    if (pathname?.includes("/my") && !activeUser) {
      router.push(pathname.replace("/my", ""));
    }
  }, [activeUser, pathname, router]);

  // When the active user switches while on the Following feed, follow them to theirs.
  useEffect(() => {
    if (
      prevActiveUser &&
      activeUser &&
      prevActiveUser.username !== activeUser.username &&
      isFollowing
    ) {
      router.push(`/@${activeUser.username}/feed`);
    }
  }, [activeUser, isFollowing, prevActiveUser, router]);

  const handleFilterReblog = useCallback(() => {
    const params = new URLSearchParams();
    params.set("no-reblog", String(!noReblog));
    router.push(pathname + "?" + params.toString());
  }, [noReblog, pathname, router]);

  const renderPill = (item: FeedMenuItem) => (
    <li key={item.id}>
      <Link
        href={item.href}
        id={item.id}
        aria-current={item.selected ? "page" : undefined}
        className={classNameObject({
          [PILL_CLASS]: true,
          [PILL_SELECTED_CLASS]: item.selected,
          [`link-${item.id}`]: true
        })}
      >
        {item.label}
      </Link>
    </li>
  );

  const reblogToggle = (
    <Button size="sm" appearance="gray-link" onClick={handleFilterReblog}>
      {reblogLabel}
    </Button>
  );

  return (
    <div>
      <div className="entry-index-menu flex items-center justify-center md:justify-between py-3.5 border-b dark:border-dark-200">
        <div className="bg-gray-100 dark:bg-gray-900 rounded-3xl lg:px-4 p-2 text-sm flex flex-col-reverse items-center md:flex-row">
          <div className="flex items-center">
            {/* Desktop: Source group + Sort group (or reblog toggle for Following) */}
            <div className="main-menu hidden lg:flex md:items-center">
              {showSources && (
                <ul className="flex flex-wrap mb-0" aria-label={i18next.t("entry-filter.source-label")}>
                  {sources.map(renderPill)}
                </ul>
              )}
              {showSources && (
                <div className="border-l border-[--border-color] mx-3 dropDown-left-border-height" />
              )}
              {isFollowing ? (
                reblogToggle
              ) : (
                <>
                  <ul className="flex flex-wrap mb-0" aria-label={i18next.t("entry-filter.sort-label")}>
                    {sorts.map(renderPill)}
                  </ul>
                  <div className="kebab-icon flex">
                    <Dropdown>
                      <DropdownToggle>
                        <Button
                          size="sm"
                          appearance="gray-link"
                          icon={kebabMenuHorizontalSvg}
                          aria-label={i18next.t("entry-filter.more-filters")}
                          aria-haspopup="menu"
                        />
                      </DropdownToggle>
                      <DropdownMenu align="left">
                        {overflow.map((item, i) => (
                          <DropdownItem key={i} href={item.href} selected={item.selected}>
                            {item.label}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </>
              )}
            </div>

            {/* Mobile/tablet: Source dropdown + Sort dropdown (or reblog toggle) */}
            <div className="main-menu flex lg:hidden md:items-center">
              {showSources && (
                <Dropdown>
                  <DropdownToggle>
                    <Button size="sm" icon={menuDownSvg} appearance="gray-link">
                      {selectedSource?.label}
                    </Button>
                  </DropdownToggle>
                  <DropdownMenu align="left">
                    {sources.map((item, i) => (
                      <DropdownItem key={i} selected={item.selected} onClick={item.onClick}>
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
              {showSources && (
                <div className="border-l border-[--border-color] mx-2 dropDown-left-border-height" />
              )}
              {isFollowing ? (
                reblogToggle
              ) : (
                <Dropdown>
                  <DropdownToggle>
                    <Button size="sm" icon={menuDownSvg} appearance="gray-link">
                      {selectedSort?.label ?? i18next.t("entry-filter.sort-label")}
                    </Button>
                  </DropdownToggle>
                  <DropdownMenu align="left">
                    {[...sorts, ...overflow].map((item, i) => (
                      <DropdownItem key={i} selected={item.selected} onClick={item.onClick}>
                        {item.label}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
