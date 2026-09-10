"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
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
import { FeedLinkPendingProbe } from "@/app/(dynamicPages)/feed/_components/feed-link-pending-probe";
import {
  clearFeedNavigationTarget,
  setFeedNavigationTarget,
  type FeedNavigationTarget
} from "@/app/(dynamicPages)/feed/_components/feed-navigation-intent";

const TAB_CLASS =
  "feed-tab flex items-center px-3 py-3 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-dark-sky";
const TAB_SELECTED_CLASS = "feed-tab-selected";

export function EntryIndexMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { activeUser } = useActiveAccount();
  const prevActiveUser = usePrevious(activeUser);

  const { sources, sorts, additionalFilters, isFollowing, filter, tag } = useFeedMenu();

  // The `router.push` half of this bar: the mobile dropdown items and the
  // reblog toggle. `useLinkStatus` cannot see a push — it only works inside a
  // <Link> — so these announce their destination themselves, and the URL
  // changing is what says the navigation landed.
  //
  // Deliberately NOT a useTransition around the push. That would be the obvious
  // way to time it, but it makes the repaint's whole push path depend on
  // `router.push` inside `startTransition` staying pending for the entire RSC
  // round trip; if it ever resolves earlier, the target is cleared before it can
  // paint and the feature silently does nothing here, in production only. The
  // URL is an unambiguous signal that needs no such assumption, and it clears at
  // the same moment.
  const pushTarget = useRef<FeedNavigationTarget | null>(null);

  const pushToFeed = useCallback((target: FeedNavigationTarget, push: () => void) => {
    pushTarget.current = target;
    setFeedNavigationTarget(target);
    push();
  }, []);

  // Keyed on the query STRING rather than on the object `useSearchParams()`
  // returns. Next memoises that object per navigation, so keying on it would
  // work today; the string needs no such guarantee, and the cost of being wrong
  // is an effect that fires on an unrelated re-render and withdraws the target
  // in the tick it was set. Not covered by a spec — this component does not
  // re-render in the window between the click and the arrival, so the two forms
  // are indistinguishable from a test.
  const searchKey = searchParams?.toString() ?? "";
  useEffect(() => {
    if (!pushTarget.current) {
      return;
    }
    // Identity-checked inside the store, so this cannot clear a target a tab
    // link announced after ours landed.
    clearFeedNavigationTarget(pushTarget.current);
    pushTarget.current = null;
  }, [pathname, searchKey]);

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
    // Same feed, different client-side filter — so the cache already holds
    // exactly what the destination will paint, and the repaint can show it
    // with the new filter applied instead of leaving the unfiltered list up
    // for the length of a round trip.
    pushToFeed({ filter, tag, noReblog: !noReblog }, () =>
      router.push(qs ? `${pathname}?${qs}` : pathname)
    );
  }, [filter, noReblog, pathname, pushToFeed, router, searchParams, tag]);

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
        {/* Renders nothing; reports this tab's pending state and destination
            to the repaint under `{children}`. Must stay INSIDE the Link —
            `useLinkStatus` has no other way to find it. */}
        <FeedLinkPendingProbe target={{ ...item.feed, noReblog: false }} />
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
                <DropdownItem
                  key={item.id}
                  selected={item.selected}
                  onClick={() => pushToFeed({ ...item.feed, noReblog: false }, item.onClick)}
                >
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
                <DropdownItem
                  key={item.id}
                  selected={item.selected}
                  onClick={() => pushToFeed({ ...item.feed, noReblog: false }, item.onClick)}
                >
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
