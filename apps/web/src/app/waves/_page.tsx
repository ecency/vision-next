"use client";

import { useEffect, useState } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";
import {
  WavesCreateCard,
  WavesCustomFeedsDialog,
  WavesFeedTabs,
  WavesListView,
  WavesReelsView
} from "@/app/waves/_components";
import { Button } from "@ui/button";
import i18next from "i18next";
import { useWavesTagFilter } from "@/app/waves/_context";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { useWavesCustomFeeds, normalizeWaveTag } from "@/app/waves/_hooks";
import { SHORTS_SOURCE, WAVE_HOST_LABELS } from "@/features/waves/consts/host-labels";
import { WavesFeedType } from "@/app/waves/_constants";

export function WavesPage() {
  const { selectedTag, setSelectedTag, selectedSource, setSelectedSource } = useWavesTagFilter();
  const { activeUser } = useActiveAccount();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);
  const { tags: customTags, sources } = useWavesCustomFeeds();
  const [storedFeedType, setStoredFeedType] = useLocalStorage<WavesFeedType>(
    PREFIX + "_waves_feed_type",
    "for-you"
  );
  const feedType = storedFeedType ?? "for-you";
  // The Shorts source is a video-only reels feed, not a container filter: it
  // routes to the dedicated shorts feed + a full-screen reels renderer.
  const isShorts = selectedSource === SHORTS_SOURCE;
  const [showCustomFeeds, setShowCustomFeeds] = useState(false);

  useEffect(() => {
    // Tag/source overlays are For-You-style feeds; opening one (including a
    // shared ?tag= / ?source= link) while persisted on Following moves the base
    // feed to For You so it doesn't fight the Following login gate or mislabel
    // the active tab.
    if (feedType === "following" && (selectedTag || selectedSource)) {
      setStoredFeedType("for-you");
    }
  }, [feedType, selectedTag, selectedSource, setStoredFeedType]);

  useEffect(() => {
    if (!activeUser && feedType === "following") {
      setStoredFeedType("for-you");
    }
  }, [activeUser, feedType, setStoredFeedType]);

  const selectForYou = () => {
    setSelectedTag(null);
    setStoredFeedType("for-you");
  };

  const selectFollowing = () => {
    if (!activeUser) {
      toggleUiProp("login");
      return;
    }
    setSelectedTag(null);
    setStoredFeedType("following");
  };

  // A custom feed tab is the For You feed scoped to a pinned tag (URL-synced via
  // the tag filter), so it reuses the existing feed query with no extra plumbing.
  // Selecting a tag clears any active source (they're mutually exclusive views).
  const selectTag = (tag: string) => {
    setStoredFeedType("for-you");
    setSelectedTag(tag);
  };

  // A source tab scopes the feed to a single container host (URL ?source=).
  const selectSource = (host: string) => {
    setStoredFeedType("for-you");
    setSelectedSource(host);
  };

  // The transient chip is only for an ad-hoc tag (tapped inside a wave); when the
  // active tag is already pinned, its own tab shows the active state instead.
  const showTagChip =
    !!selectedTag && !selectedSource && !customTags.includes(normalizeWaveTag(selectedTag));
  // Same for a source that's active but not pinned (a shared ?source= link, or
  // one just removed from the picker): surface it so the feed isn't silently
  // filtered with no active tab and no obvious way back.
  const showSourceChip = !!selectedSource && !sources.includes(selectedSource);
  const sourceLabel = selectedSource ? (WAVE_HOST_LABELS[selectedSource] ?? selectedSource) : "";

  return (
    <>
      <WavesFeedTabs
        feedType={feedType}
        selectedTag={selectedTag}
        selectedSource={selectedSource}
        customTags={customTags}
        sources={sources}
        canUseFollowing={!!activeUser}
        onSelectForYou={selectForYou}
        onSelectFollowing={selectFollowing}
        onSelectTag={selectTag}
        onSelectSource={selectSource}
        onAdd={() => setShowCustomFeeds(true)}
      />
      {!isShorts && <WavesCreateCard />}
      {showTagChip && (
        <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold">
            {i18next.t("waves.tag-feed-indicator", { tag: selectedTag })}
          </span>
          <Button appearance="gray-link" size="xs" onClick={() => setSelectedTag(null)}>
            {i18next.t("waves.tag-feed-clear")}
          </Button>
        </div>
      )}
      {showSourceChip && (
        <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 mb-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="font-semibold">
            {i18next.t("waves.source-feed-indicator", { source: sourceLabel })}
          </span>
          <Button appearance="gray-link" size="xs" onClick={() => setSelectedSource(null)}>
            {i18next.t("waves.tag-feed-clear")}
          </Button>
        </div>
      )}
      {isShorts ? (
        <WavesReelsView username={activeUser?.username} />
      ) : (
        <WavesListView feedType={feedType} username={activeUser?.username} />
      )}
      <WavesCustomFeedsDialog
        show={showCustomFeeds}
        onHide={() => setShowCustomFeeds(false)}
        onSelectTag={selectTag}
        onSelectSource={selectSource}
      />
    </>
  );
}
