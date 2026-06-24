"use client";

import { getWavesFeedQueryOptions } from "@ecency/sdk";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { DetectBottom } from "@/features/shared";
import { WavesListLoader } from "@/app/waves/_components/waves-list-loader";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteDataFlow } from "@/utils";
import { useWavesAutoRefresh } from "@/app/waves/_hooks";
import { WavesRefreshPopup } from "@/app/waves/_components";
import { WavesFastReplyDialog } from "@/app/waves/_components/waves-fast-reply-dialog";
import { WaveEntry } from "@/entities";
import { InfiniteData, useQuery, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { getPromotedPostsQuery } from "@ecency/sdk";
import {
  WAVES_FEED_SCROLL_STORAGE_KEY,
  WavesFeedScrollState,
  WavesFeedType
} from "@/app/waves/_constants";
import { useWavesGrid } from "@/app/waves/_hooks";
import { useWavesTagFilter } from "@/app/waves/_context";
import { Button } from "@ui/button";
import i18next from "i18next";
import { sentry } from "@/core/sentry/lazy-sentry";

interface Props {
  feedType: WavesFeedType;
  username?: string;
}

export function WavesListView({ feedType, username }: Props) {
  const { selectedTag } = useWavesTagFilter();
  const tag = feedType === "for-you" ? selectedTag : null;
  // All three feeds are now one combined, cross-container, keyset-paginated
  // endpoint; tag and following are just filters on the same stream.
  // The logged-in user is the observer: server-side mute filtering keeps each
  // page full of waves they can see (client-side filtering would shrink pages).
  const observer = username || undefined;
  const queryOptions = useMemo(() => {
    if (tag) {
      return getWavesFeedQueryOptions({ tag, observer });
    }

    if (feedType === "following") {
      return getWavesFeedQueryOptions({ following: username, observer });
    }

    return getWavesFeedQueryOptions({ observer });
  }, [feedType, tag, username, observer]);

  // The Following feed needs a username; without one `following` drops and the
  // query would silently become the unfiltered combined feed, so gate it until
  // the active user is known.
  const { data, fetchNextPage, isError, error, hasNextPage, refetch } = useInfiniteQuery({
    ...queryOptions,
    enabled: feedType !== "following" || !!username
  });
  const previousErrorMessage = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!isError || !error) {
      previousErrorMessage.current = undefined;
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    if (previousErrorMessage.current !== message) {
      previousErrorMessage.current = message;
      // eslint-disable-next-line no-console
      console.error("[Waves] Failed to load feed", {
        feedType,
        tag,
        message
      });
      sentry.captureException(error, {
        extra: { feedType, tag }
      });
    }
  }, [error, feedType, isError, tag]);
  const { data: promoted } = useQuery({
    ...getPromotedPostsQuery<WaveEntry>("waves"),
    enabled: !tag
  });
  const dataFlow = useInfiniteDataFlow(data);
  const [grid] = useWavesGrid();
  const queryClient = useQueryClient();
  // Reuse the query's own (normalized) key so the refresh-popup cache write
  // always targets exactly what useInfiniteQuery reads, with no drift.
  const wavesQueryKey = queryOptions.queryKey;
  const combinedDataFlow = useMemo(() => {
    if (!promoted || tag) {
      return dataFlow;
    }

    const tempPromoted = [...promoted];
    return dataFlow
      .filter(({ author, permlink }) =>
        promoted.every(
          ({ author: promotedAuthor, permlink: promotedPermlink }) =>
            promotedAuthor !== author || promotedPermlink !== permlink
        )
      )
      .reduce(
        (acc, item, index) => [
          ...acc,
          item,
          ...(index % 4 === 1 && tempPromoted.length > 0 ? [tempPromoted.shift()!] : [])
        ],
        [] as WaveEntry[]
      );
  }, [dataFlow, promoted, tag]);

  const [replyingEntry, setReplyingEntry] = useState<WaveEntry>();
  const shouldAutoRefresh = feedType === "for-you" && !tag;
  const { newWaves, clear, now } = useWavesAutoRefresh(
    shouldAutoRefresh ? dataFlow[0] : undefined,
    observer
  );
  const [pendingScroll, setPendingScroll] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedValue = sessionStorage.getItem(WAVES_FEED_SCROLL_STORAGE_KEY);

    if (!storedValue) {
      return;
    }

    try {
      const parsed = JSON.parse(storedValue) as WavesFeedScrollState;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      const feedMatches = !parsed.feedType || parsed.feedType === feedType;
      const gridMatches = !parsed.grid || parsed.grid === grid;
      const urlMatches = !parsed.url || parsed.url === currentUrl;

      if (
        gridMatches &&
        typeof parsed.scrollY === "number" &&
        urlMatches &&
        feedMatches
      ) {
        setPendingScroll(parsed.scrollY);
      }
    } catch (e) {
      // Ignore malformed state
    } finally {
      sessionStorage.removeItem(WAVES_FEED_SCROLL_STORAGE_KEY);
    }
  }, [feedType, grid]);

  useEffect(() => {
    if (pendingScroll === null) {
      return;
    }

    if (combinedDataFlow.length === 0) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      window.scrollTo({ top: pendingScroll });
      setPendingScroll(null);
    });

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [combinedDataFlow.length, pendingScroll]);

  // Every feed type now paginates via the keyset cursor, so infinite scroll
  // is enabled across For You, Following and Tag (not just For You).
  const shouldShowDetectBottom = hasNextPage;

  if (isError && combinedDataFlow.length === 0) {
    return (
      <div className="rounded-2xl bg-white dark:bg-dark-200 p-4 text-sm text-gray-700 dark:text-gray-300">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="font-semibold">
              {i18next.t("waves.feed.unavailable", {
                defaultValue: "We couldn’t load waves right now."
              })}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {i18next.t("waves.feed.check-connection", {
                defaultValue:
                  "Check your connection or firewall settings for Hive RPC hosts and try again."
              })}
            </div>
          </div>
          <div className="flex gap-2">
            <Button appearance="link" onClick={() => refetch()} size="sm">
              {i18next.t("g.retry", { defaultValue: "Retry" })}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">
      {shouldAutoRefresh && newWaves.length > 0 && (
        <WavesRefreshPopup
          entries={newWaves}
          onClick={() => {
            const wavesToInsert = [...newWaves];

            if (wavesToInsert.length === 0) {
              clear();
              window.scrollTo({ top: 0, behavior: "smooth" });
              void refetch();
              return;
            }

            queryClient.setQueryData<
              InfiniteData<WaveEntry[], string | undefined>
            >(wavesQueryKey, (prev) => {
              if (!prev) {
                return {
                  pages: [wavesToInsert],
                  pageParams: [undefined]
                };
              }

              // A wave is uniquely identified by author + permlink (entry.id is
              // not reliable across the feed sources).
              const keyOf = (entry: WaveEntry) => `${entry.author}/${entry.permlink}`;
              const existingKeys = new Set(
                prev.pages.flatMap((page) => page.map(keyOf))
              );
              const deduped = wavesToInsert.filter(
                (entry) => !existingKeys.has(keyOf(entry))
              );

              if (deduped.length === 0) {
                return prev;
              }

              const [firstPage = [], ...restPages] = prev.pages;

              return {
                ...prev,
                pages: [[...deduped, ...firstPage], ...restPages]
              };
            });

            clear();
            window.scrollTo({ top: 0, behavior: "smooth" });
            void refetch();
          }}
        />
      )}
      {combinedDataFlow.map((item, i) => (
        <WavesListItem
          key={`${item.author}/${item.permlink}`}
          i={i}
          item={item}
          onExpandReplies={() => setReplyingEntry(item)}
          now={now}
          feedType={feedType}
        />
      ))}

      <WavesListLoader data={dataFlow} failed={isError} isEndReached={!hasNextPage} />
      {shouldShowDetectBottom && <DetectBottom onBottom={() => fetchNextPage()} />}

      <WavesFastReplyDialog
        show={!!replyingEntry}
        onHide={() => setReplyingEntry(undefined)}
        entry={replyingEntry}
      />
    </div>
  );
}
