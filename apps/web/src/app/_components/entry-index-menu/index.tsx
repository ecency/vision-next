"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import React, { useCallback, useEffect, useMemo } from "react";
import "./_index.scss";
import { menuDownSvg } from "@ui/svg";
import Link from "next/link";
import i18next from "i18next";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import usePrevious from "react-use/lib/usePrevious";
import { Button } from "@ui/button";
import { classNameObject } from "@ui/util";
import {
  FeedMenuItem,
  globalFeedFallbackPath,
  useFeedMenu
} from "@/app/_components/entry-index-menu/use-feed-menu";

const TAB_CLASS =
  "feed-tab flex items-center px-3 py-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-dark-sky";
const TAB_SELECTED_CLASS = "feed-tab-selected";

export function EntryIndexMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { activeUser } = useActiveAccount();
  const prevActiveUser = usePrevious(activeUser);

  const { sources, sorts, additionalFilters, isFollowing } = useFeedMenu();

  const noReblog = useMemo(() => searchParams?.get("no-reblog") === "true", [searchParams]);

  // Show the source group whenever there's a real choice: logged-in users get
  // Following/Communities/Global, and anyone browsing a #hashtag gets the tag
  // chip + Global. A lone Global (logged-out, no tag) is implied, so it's hidden.
  const showSources = sources.length > 1;
  const selectedSource = useMemo(
    () => sources.find((s) => s.selected) ?? sources[sources.length - 1],
    [sources]
  );
  // Include Muted/Promoted so the mobile trigger reflects the active
  // filter when the dropdown is closed.
  const selectedSort = useMemo(
    () => [...sorts, ...additionalFilters].find((s) => s.selected),
    [sorts, additionalFilters]
  );

  // Logged-out users can't view a community ("/my") feed — fall back to global.
  useEffect(() => {
    const fallback = globalFeedFallbackPath(pathname);
    if (fallback && !activeUser) {
      router.push(fallback);
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
    // Preserve any unrelated query params already on the URL.
    const params = new URLSearchParams(searchParams?.toString());
    if (noReblog) {
      params.delete("no-reblog");
    } else {
      params.set("no-reblog", "true");
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }, [noReblog, pathname, router, searchParams]);

  const renderTab = (item: FeedMenuItem) => (
    <li key={item.id}>
      <Link
        href={item.href}
        id={item.id}
        aria-current={item.selected ? "page" : undefined}
        className={classNameObject({
          [TAB_CLASS]: true,
          [TAB_SELECTED_CLASS]: item.selected,
          [`link-${item.id}`]: true
        })}
      >
        {item.label}
      </Link>
    </li>
  );

  const reblogToggle = (
    <button
      type="button"
      role="switch"
      aria-checked={!noReblog}
      onClick={handleFilterReblog}
      className="feed-reblog-toggle"
    >
      <span>{i18next.t("entry-filter.show-reblogs")}</span>
      <span className="feed-switch-track" aria-hidden="true">
        <span className="feed-switch-thumb" />
      </span>
    </button>
  );

  return (
    <div className="entry-index-menu feed-navigation">
      <div className="hidden lg:flex flex-col feed-navigation-desktop">
        {showSources && (
          <ul className="feed-source-tabs" aria-label={i18next.t("entry-filter.source-label")}>
            {sources.map(renderTab)}
          </ul>
        )}
        {!isFollowing && (
          <div className="feed-sort-controls">
            <ul className="feed-sort-tabs" aria-label={i18next.t("entry-filter.sort-label")}>
              {[...sorts, ...additionalFilters].map(renderTab)}
            </ul>
          </div>
        )}
      </div>
      <div className="flex lg:hidden feed-navigation-mobile">
        {showSources && (
          <Dropdown>
            <DropdownToggle>
              <Button size="sm" icon={menuDownSvg} appearance="gray-link">
                {selectedSource?.label}
              </Button>
            </DropdownToggle>
            <DropdownMenu align="left">
              {sources.map((item) => (
                <DropdownItem key={item.id} selected={item.selected} onClick={item.onClick}>
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        )}
        {!isFollowing && (
          <Dropdown>
            <DropdownToggle>
              <Button size="sm" icon={menuDownSvg} appearance="gray-link">
                {selectedSort?.label ?? i18next.t("entry-filter.sort-label")}
              </Button>
            </DropdownToggle>
            <DropdownMenu align="left">
              {[...sorts, ...additionalFilters].map((item) => (
                <DropdownItem key={item.id} selected={item.selected} onClick={item.onClick}>
                  {item.label}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        )}
      </div>
      {isFollowing && reblogToggle}
    </div>
  );
}
