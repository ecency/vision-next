"use client";

import { useEffect } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";
import { WavesHostSelection } from "@/app/waves/_components/waves-host-selection";
import { WavesCreateCard, WavesListView, WavesMasonryView } from "@/app/waves/_components";
import { WavesGridSelection } from "@/app/waves/_components/waves-grid-selection";
import { useWavesGrid } from "@/app/waves/_hooks";
import { Button } from "@ui/button";
import i18next from "i18next";
import { useWavesHost, useWavesTagFilter } from "@/app/waves/_context";
import { useClientActiveUser } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import clsx from "clsx";
import { WavesFeedType } from "@/app/waves/_constants";

export function WavesPage() {
  const { host, setHost } = useWavesHost();
  const [, setWaveFormHost] = useLocalStorage<string>(PREFIX + "_wf_th", "ecency.waves");
  const [grid, setGrid] = useWavesGrid();
  const { selectedTag, setSelectedTag } = useWavesTagFilter();
  const activeUser = useClientActiveUser();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);
  const [storedFeedType, setStoredFeedType] = useLocalStorage<WavesFeedType>(
    PREFIX + "_waves_feed_type",
    "for-you"
  );
  const feedType = storedFeedType ?? "for-you";
  const isFollowing = feedType === "following";

  useEffect(() => {
    if (feedType === "for-you" && selectedTag && grid !== "feed") {
      setGrid("feed");
    }
  }, [feedType, grid, selectedTag, setGrid]);

  useEffect(() => {
    if (feedType === "following") {
      if (grid !== "feed") {
        setGrid("feed");
      }

      if (selectedTag) {
        setSelectedTag(null);
      }
    }
  }, [feedType, grid, selectedTag, setGrid, setSelectedTag]);

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

    setStoredFeedType(nextFeed);
  };

  const handleHostChange = (nextHost: string) => {
    setHost(nextHost);
    setWaveFormHost(nextHost);
    if (selectedTag) {
      setSelectedTag(null);
    }
  };

  useEffect(() => {
    if (host) {
      setWaveFormHost(host);
    }
  }, [host, setWaveFormHost]);

  const feedTabs: { key: WavesFeedType; label: string }[] = [
    {
      key: "for-you",
      label: i18next.t("waves.feed.for-you", { defaultValue: "For you" })
    },
    {
      key: "following",
      label: i18next.t("waves.feed.following", { defaultValue: "Following" })
    }
  ];

  return (
    <>
      <div className="px-4 pt-2 pb-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          {/* left spacer (keeps center truly centered) */}
          <div />
          <div className="justify-self-center">
            <div className="flex items-center gap-1">
            {feedTabs.map(({ key, label }) => {
              const isActive = feedType === key;
              const isDisabled = key === "following" && !activeUser;

              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={isActive}
                  aria-disabled={isDisabled}
                  className={clsx(
                    "relative px-4 py-3 text-sm font-semibold transition-colors duration-150 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500",
                    isActive
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400",
                    !isActive && "hover:bg-gray-100/70 dark:hover:bg-dark-300/70",
                    isDisabled && !isActive && "opacity-60"
                  )}
                  onClick={() => handleFeedTypeChange(key)}
                >
                  {label}
                  <span
                    className={clsx(
                      "pointer-events-none absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-blue-500 dark:bg-blue-400 transition-opacity duration-150",
                      isActive ? "opacity-100" : "opacity-0"
                    )}
                  />
                </button>
              );
            })}
          </div>
          </div>
          <div className="justify-self-end flex items-end gap-2">
            <WavesHostSelection host={host} setHost={handleHostChange} />
            {!selectedTag && !isFollowing && <WavesGridSelection />}
          </div>
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
      {grid === "feed" && (
        <WavesListView host={host} feedType={feedType} username={activeUser?.username} />
      )}
      {grid === "masonry" && !selectedTag && !isFollowing && <WavesMasonryView host={host} />}
    </>
  );
}
