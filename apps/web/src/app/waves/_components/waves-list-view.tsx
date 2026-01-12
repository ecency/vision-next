"use client";

import {
  getWavesByHostQueryOptions,
  getWavesByTagQueryOptions,
  getWavesFollowingQueryOptions
} from "@ecency/sdk";
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
import { QueryIdentifiers } from "@/core/react-query";
import { useWavesTagFilter } from "@/app/waves/_context";
import { Button } from "@ui/button";
import i18next from "i18next";
import * as Sentry from "@sentry/nextjs";

interface Props {
  host: string;
  feedType: WavesFeedType;
  username?: string;
}

export function WavesListView({ host, feedType, username }: Props) {
  const { selectedTag } = useWavesTagFilter();
  const tag = feedType === "for-you" ? selectedTag : null;
  const queryOptions = useMemo(() => {
    if (tag) {
      return getWavesByTagQueryOptions(host, tag);
    }

    if (feedType === "following") {
      return getWavesFollowingQueryOptions(host, username);
    }

    return getWavesByHostQueryOptions(host);
  }, [feedType, host, tag, username]);

  const { data, fetchNextPage, isError, error, hasNextPage, refetch } = useInfiniteQuery(queryOptions);
  const previousErrorMessage = useRef<string>();

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
        host,
        feedType,
        tag,
        message
      });
      Sentry.captureException(error, {
        data: { host, feedType, tag }
      });
    }
  }, [error, feedType, host, isError, tag]);
  const { data: promoted } = useQuery({
    ...getPromotedPostsQuery<WaveEntry>("waves"),
    enabled: !tag
  });
  const dataFlow = useInfiniteDataFlow(data);
  const [grid] = useWavesGrid();
  const queryClient = useQueryClient();
  const wavesQueryKey = useMemo(() => {
    if (tag) {
      return [QueryIdentifiers.THREADS, host, "tag", tag] as const;
    }

    if (feedType === "following") {
      return [QueryIdentifiers.THREADS, host, "following", username ?? ""] as const;
    }

    return [QueryIdentifiers.THREADS, host] as const;
  }, [feedType, host, tag, username]);
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
    shouldAutoRefresh ? dataFlow[0] : undefined
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
      const hostMatches = !parsed.host || parsed.host === host;
      const feedMatches = !parsed.feedType || parsed.feedType === feedType;
      const gridMatches = !parsed.grid || parsed.grid === grid;
      const urlMatches = !parsed.url || parsed.url === currentUrl;

      if (
        hostMatches &&
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
  }, [feedType, grid, host]);

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

  const shouldShowDetectBottom = feedType === "for-you" && !tag && hasNextPage;

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
              InfiniteData<WaveEntry[], WaveEntry | undefined>
            >(wavesQueryKey, (prev) => {
              if (!prev) {
                return {
                  pages: [wavesToInsert],
                  pageParams: [undefined]
                };
              }

              const existingIds = new Set(
                prev.pages.flatMap((page) => page.map((entry) => entry.id))
              );
              const deduped = wavesToInsert.filter(
                (entry) => !existingIds.has(entry.id)
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
          currentHost={host}
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
