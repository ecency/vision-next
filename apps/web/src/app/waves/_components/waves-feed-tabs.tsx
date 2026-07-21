"use client";

import React from "react";
import clsx from "clsx";
import i18next from "i18next";
import { UilPlus } from "@tooni/iconscout-unicons-react";
import { WavesFeedType } from "@/app/waves/_constants";
import { normalizeWaveTag } from "@/app/waves/_hooks";
import { WAVE_HOST_LABELS } from "@/features/waves/consts/host-labels";

interface Props {
  feedType: WavesFeedType;
  selectedTag: string | null;
  selectedSource: string | null;
  customTags: string[];
  sources: string[];
  canUseFollowing: boolean;
  onSelectForYou: () => void;
  onSelectFollowing: () => void;
  onSelectTag: (tag: string) => void;
  onSelectSource: (host: string) => void;
  onAdd: () => void;
}

/**
 * Waves feed tabs: For you / Following, plus one tab per pinned custom feed (a
 * source/container or a tag), and a trailing "+" to manage them. Mirrors the
 * mobile waves custom tab bar. With no custom feeds the two base tabs split the
 * width 50/50; once a custom tab is pinned the bar becomes horizontally
 * scrollable with auto-width tabs.
 *
 * A source tab scopes the feed to one container host (URL ?source=); a tag tab
 * is the For You feed scoped to that tag (URL ?tag=). Both reuse the existing
 * feed query, so no new data plumbing here.
 */
export function WavesFeedTabs({
  feedType,
  selectedTag,
  selectedSource,
  customTags,
  sources,
  canUseFollowing,
  onSelectForYou,
  onSelectFollowing,
  onSelectTag,
  onSelectSource,
  onAdd
}: Props) {
  // No pinned feeds yet: keep the original 50/50 split (like mobile) instead of
  // left-stacking; add a pinned feed and the bar becomes scrollable auto-width.
  const fluid = customTags.length === 0 && sources.length === 0;

  const isForYou = feedType === "for-you" && !selectedTag && !selectedSource;
  const isFollowing = feedType === "following";

  const tabClass = (active: boolean, opts?: { disabled?: boolean; fluid?: boolean }) =>
    clsx(
      "relative px-4 py-3.5 text-[15px] whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-500 hover:bg-gray-100/60 dark:hover:bg-dark-300/40",
      opts?.fluid ? "flex-1" : "shrink-0",
      active
        ? "font-bold text-gray-900 dark:text-white"
        : "font-medium text-gray-500 dark:text-gray-400",
      opts?.disabled && !active && "opacity-60"
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
      <div className={clsx("flex items-stretch", !fluid && "overflow-x-auto no-scrollbar")}>
        <button
          type="button"
          aria-pressed={isForYou}
          className={tabClass(isForYou, { fluid })}
          onClick={onSelectForYou}
        >
          {i18next.t("waves.feed.for-you")}
          {underline(isForYou)}
        </button>

        <button
          type="button"
          aria-pressed={isFollowing}
          title={!canUseFollowing ? i18next.t("g.login") : undefined}
          className={tabClass(isFollowing, { fluid, disabled: !canUseFollowing })}
          onClick={onSelectFollowing}
        >
          {i18next.t("waves.feed.following")}
          {underline(isFollowing)}
        </button>

        {sources.map((host) => {
          const active = selectedSource === host;
          return (
            <button
              key={host}
              type="button"
              aria-pressed={active}
              className={tabClass(active)}
              onClick={() => onSelectSource(host)}
            >
              {WAVE_HOST_LABELS[host] ?? host}
              {underline(active)}
            </button>
          );
        })}

        {customTags.map((tag) => {
          // selectedTag may arrive un-normalized from the URL (?tag=Sports);
          // compare normalized so the matching pinned tab still shows active.
          const active =
            !selectedSource &&
            feedType === "for-you" &&
            normalizeWaveTag(selectedTag ?? "") === tag;
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
          <UilPlus className="size-5" />
        </button>
      </div>
    </div>
  );
}
