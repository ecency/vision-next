"use client";

import { useEffect, useState } from "react";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";
import {
  WavesCreateCard,
  WavesCustomFeedsDialog,
  WavesFeedTabs,
  WavesListView
} from "@/app/waves/_components";
import { Button } from "@ui/button";
import i18next from "i18next";
import { useWavesTagFilter } from "@/app/waves/_context";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { useWavesCustomFeeds, normalizeWaveTag } from "@/app/waves/_hooks";
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
  const [showCustomFeeds, setShowCustomFeeds] = useState(false);

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
  const showTagChip = !!selectedTag && !customTags.includes(normalizeWaveTag(selectedTag));

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
      <WavesCreateCard />
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
      <WavesListView feedType={feedType} username={activeUser?.username} />
      <WavesCustomFeedsDialog
        show={showCustomFeeds}
        onHide={() => setShowCustomFeeds(false)}
        onSelectTag={selectTag}
        onSelectSource={selectSource}
      />
    </>
  );
}
