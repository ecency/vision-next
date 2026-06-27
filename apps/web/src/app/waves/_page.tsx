"use client";

import { useEffect } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";
import { WavesCreateCard, WavesListView } from "@/app/waves/_components";
import { Button } from "@ui/button";
import i18next from "i18next";
import { useWavesTagFilter } from "@/app/waves/_context";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import clsx from "clsx";
import { WavesFeedType } from "@/app/waves/_constants";

export function WavesPage() {
  const { selectedTag, setSelectedTag } = useWavesTagFilter();
  const { activeUser } = useActiveAccount();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);
  const [storedFeedType, setStoredFeedType] = useLocalStorage<WavesFeedType>(
    PREFIX + "_waves_feed_type",
    "for-you"
  );
  const feedType = storedFeedType ?? "for-you";

  useEffect(() => {
    // Tags live on the For You feed; picking one while on Following moves the
    // user to For You (where the tag actually applies) instead of dropping it.
    if (feedType === "following" && selectedTag) {
      setStoredFeedType("for-you");
    }
  }, [feedType, selectedTag, setStoredFeedType]);

  useEffect(() => {
    if (!activeUser && feedType === "following") {
      setStoredFeedType("for-you");
    }
  }, [activeUser, feedType, setStoredFeedType]);

  const handleFeedTypeChange = (nextFeed: WavesFeedType) => {
    if (nextFeed === feedType) {
      return;
    }

    if (nextFeed === "following" && !activeUser) {
      toggleUiProp("login");
      return;
    }

    // Following has no tag filter; drop any active tag when switching to it so the
    // effect above doesn't immediately bounce the user back to For You.
    if (nextFeed === "following" && selectedTag) {
      setSelectedTag(null);
    }

    setStoredFeedType(nextFeed);
  };

  const feedTabs: { key: WavesFeedType; label: string }[] = [
    {
      key: "for-you",
      label: i18next.t("waves.feed.for-you")
    },
    {
      key: "following",
      label: i18next.t("waves.feed.following")
    }
  ];

  return (
    <>
      <div className="sticky top-0 z-10 bg-white dark:bg-dark-200 border-b border-[--border-color] rounded-t-2xl">
        <div className="flex">
          {feedTabs.map(({ key, label }) => {
            const isActive = feedType === key;
            const isDisabled = key === "following" && !activeUser;

            return (
              <button
                key={key}
                type="button"
                aria-pressed={isActive}
                title={isDisabled ? i18next.t("g.login") : undefined}
                className={clsx(
                  "relative flex-1 py-3.5 text-[15px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500 hover:bg-gray-100/60 dark:hover:bg-dark-300/40",
                  isActive
                    ? "font-bold text-gray-900 dark:text-white"
                    : "font-medium text-gray-500 dark:text-gray-400",
                  isDisabled && !isActive && "opacity-60"
                )}
                onClick={() => handleFeedTypeChange(key)}
              >
                {label}
                <span
                  className={clsx(
                    "pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-[3px] rounded-full bg-blue-500 dark:bg-blue-400 transition-opacity duration-150",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>
      <WavesCreateCard />
      {selectedTag && (
        <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold">
            {i18next.t("waves.tag-feed-indicator", { tag: selectedTag })}
          </span>
          <Button appearance="gray-link" size="xs" onClick={() => setSelectedTag(null)}>
            {i18next.t("waves.tag-feed-clear")}
          </Button>
        </div>
      )}
      <WavesListView feedType={feedType} username={activeUser?.username} />
    </>
  );
}
