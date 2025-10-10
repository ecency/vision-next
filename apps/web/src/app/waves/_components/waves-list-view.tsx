"use client";

import { getWavesByHostQuery, getWavesByTagQuery } from "@/api/queries";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { DetectBottom } from "@/features/shared";
import { WavesListLoader } from "@/app/waves/_components/waves-list-loader";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteDataFlow } from "@/utils";
import { useWavesAutoRefresh } from "@/app/waves/_hooks";
import { WavesRefreshPopup } from "@/app/waves/_components";
import { WavesFastReplyDialog } from "@/app/waves/_components/waves-fast-reply-dialog";
import { WaveEntry } from "@/entities";
import { InfiniteData, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPromotedPostsQuery } from "@ecency/sdk";
import { WAVES_FEED_SCROLL_STORAGE_KEY, WavesFeedScrollState } from "@/app/waves/_constants";
import { useWavesGrid } from "@/app/waves/_hooks";
import { QueryIdentifiers } from "@/core/react-query";
import { useWavesTagFilter } from "@/app/waves/_context";

interface Props {
  host: string;
}

export function WavesListView({ host }: Props) {
  const { selectedTag } = useWavesTagFilter();
  const query = useMemo(
    () => (selectedTag ? getWavesByTagQuery(host, selectedTag) : getWavesByHostQuery(host)),
    [host, selectedTag]
  );

  const { data, fetchNextPage, isError, hasNextPage, refetch } = query.useClientQuery();
  const { data: promoted } = useQuery({
    ...getPromotedPostsQuery<WaveEntry>("waves"),
    enabled: !selectedTag
  });
  const dataFlow = useInfiniteDataFlow(data);
  const [grid] = useWavesGrid();
  const queryClient = useQueryClient();
  const wavesQueryKey = useMemo(
    () =>
      selectedTag
        ? ([QueryIdentifiers.THREADS, host, "tag", selectedTag] as const)
        : ([QueryIdentifiers.THREADS, host] as const),
    [host, selectedTag]
  );
  const combinedDataFlow = useMemo(() => {
    if (!promoted || selectedTag) {
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
  }, [dataFlow, promoted]);

  const [replyingEntry, setReplyingEntry] = useState<WaveEntry>();
  const { newWaves, clear, now } = useWavesAutoRefresh(selectedTag ? undefined : dataFlow[0]);
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
      const gridMatches = !parsed.grid || parsed.grid === grid;
      const urlMatches = !parsed.url || parsed.url === currentUrl;

      if (hostMatches && gridMatches && typeof parsed.scrollY === "number" && urlMatches) {
        setPendingScroll(parsed.scrollY);
      }
    } catch (e) {
      // Ignore malformed state
    } finally {
      sessionStorage.removeItem(WAVES_FEED_SCROLL_STORAGE_KEY);
    }
  }, [grid, host]);

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

  return (
    <div className="flex flex-col pb-8">
      {!selectedTag && newWaves.length > 0 && (
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
        />
      ))}

      <WavesListLoader data={dataFlow} failed={isError} isEndReached={!hasNextPage} />
      {!selectedTag && <DetectBottom onBottom={() => fetchNextPage()} />}

      <WavesFastReplyDialog
        show={!!replyingEntry}
        onHide={() => setReplyingEntry(undefined)}
        entry={replyingEntry}
      />
    </div>
  );
}
