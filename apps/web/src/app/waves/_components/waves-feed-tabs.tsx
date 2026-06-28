"use client";

import React from "react";
import clsx from "clsx";
import i18next from "i18next";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import { WavesFeedType } from "@/app/waves/_constants";

interface Props {
  feedType: WavesFeedType;
  selectedTag: string | null;
  customTags: string[];
  canUseFollowing: boolean;
  onSelectForYou: () => void;
  onSelectFollowing: () => void;
  onSelectTag: (tag: string) => void;
  onAdd: () => void;
}

/**
 * Horizontally scrollable waves feed tabs: For you / Following plus one tab per
 * pinned custom feed (tag), and a trailing "+" to manage them. Mirrors the mobile
 * waves custom tab bar. A custom tag tab is just the For-you feed scoped to that
 * tag (driven by the URL-synced tag filter), so no new feed query is needed.
 */
export function WavesFeedTabs({
  feedType,
  selectedTag,
  customTags,
  canUseFollowing,
  onSelectForYou,
  onSelectFollowing,
  onSelectTag,
  onAdd
}: Props) {
  const isForYou = feedType === "for-you" && !selectedTag;
  const isFollowing = feedType === "following";

  const tabClass = (active: boolean, disabled?: boolean) =>
    clsx(
      "relative shrink-0 px-4 py-3.5 text-[15px] whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500 hover:bg-gray-100/60 dark:hover:bg-dark-300/40",
      active
        ? "font-bold text-gray-900 dark:text-white"
        : "font-medium text-gray-500 dark:text-gray-400",
      disabled && !active && "opacity-60"
    );

  const underline = (active: boolean) => (
    <span
      className={clsx(
        "pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-[3px] rounded-full bg-blue-500 dark:bg-blue-400 transition-opacity duration-150",
        active ? "opacity-100" : "opacity-0"
      )}
    />
  );

  return (
    <div className="sticky top-0 z-10 bg-white dark:bg-dark-200 border-b border-[--border-color] rounded-t-2xl">
      <div className="flex items-stretch overflow-x-auto no-scrollbar">
        <button
          type="button"
          aria-pressed={isForYou}
          className={tabClass(isForYou)}
          onClick={onSelectForYou}
        >
          {i18next.t("waves.feed.for-you")}
          {underline(isForYou)}
        </button>

        <button
          type="button"
          aria-pressed={isFollowing}
          title={!canUseFollowing ? i18next.t("g.login") : undefined}
          className={tabClass(isFollowing, !canUseFollowing)}
          onClick={onSelectFollowing}
        >
          {i18next.t("waves.feed.following")}
          {underline(isFollowing)}
        </button>

        {customTags.map((tag) => {
          const active = feedType === "for-you" && selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              aria-pressed={active}
              className={tabClass(active)}
              onClick={() => onSelectTag(tag)}
            >
              #{tag}
              {underline(active)}
            </button>
          );
        })}

        <button
          type="button"
          aria-label={i18next.t("waves.add-feed")}
          title={i18next.t("waves.add-feed")}
          className="shrink-0 px-3 flex items-center text-gray-500 hover:text-blue-dark-sky transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          onClick={onAdd}
        >
          <UilPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
