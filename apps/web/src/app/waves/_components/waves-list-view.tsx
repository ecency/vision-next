"use client";

import { getWavesByHostQuery } from "@/api/queries";
import { WavesListItem } from "@/app/waves/_components/waves-list-item";
import { DetectBottom } from "@/features/shared";
import { WavesListLoader } from "@/app/waves/_components/waves-list-loader";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteDataFlow } from "@/utils";
import { useWavesAutoRefresh } from "@/app/waves/_hooks";
import { WavesRefreshPopup } from "@/app/waves/_components";
import { WavesFastReplyDialog } from "@/app/waves/_components/waves-fast-reply-dialog";
import { WaveEntry } from "@/entities";
import { useQuery } from "@tanstack/react-query";
import { getPromotedPostsQuery } from "@ecency/sdk";
import { WAVES_FEED_SCROLL_STORAGE_KEY, WavesFeedScrollState } from "@/app/waves/_constants";
import { useWavesGrid } from "@/app/waves/_hooks";

interface Props {
  host: string;
}

export function WavesListView({ host }: Props) {
  const { data, fetchNextPage, isError, hasNextPage, refetch } = getWavesByHostQuery(host).useClientQuery();
  const { data: promoted } = useQuery(getPromotedPostsQuery<WaveEntry>("waves"));
  const dataFlow = useInfiniteDataFlow(data);
  const [grid] = useWavesGrid();
  const combinedDataFlow = useMemo(() => {
    if (!promoted) {
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
  const { newWaves, clear, now } = useWavesAutoRefresh(dataFlow[0]);
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
      {newWaves.length > 0 && (
        <WavesRefreshPopup
          entries={newWaves}
          onClick={async () => {
            await refetch();
            clear();
            window.scrollTo({ top: 0, behavior: "smooth" });
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
      <DetectBottom onBottom={() => fetchNextPage()} />

      <WavesFastReplyDialog
        show={!!replyingEntry}
        onHide={() => setReplyingEntry(undefined)}
        entry={replyingEntry}
      />
    </div>
  );
}
