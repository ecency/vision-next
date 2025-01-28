import { AVAILABLE_THREAD_HOSTS } from "@/features/waves";
import { DeckThreadEditItem, DeckThreadItemSkeleton, ThreadItem } from "./deck-items";
import { DeckThreadItemViewer } from "./content-viewer";
import { GenericDeckWithDataColumn } from "./generic-deck-with-data-column";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { WavesDeckGridItem } from "../types";
import { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";
import { DeckGridContext } from "../deck-manager";
import {
  DeckThreadsColumnManagerContext,
  DeckThreadsContext,
  IdentifiableEntry,
  ThreadItemEntry,
  withDeckThreadsColumnManager
} from "./deck-threads-manager";
import moment from "moment/moment";
import usePrevious from "react-use/lib/usePrevious";
import { newDataComingPaginatedCondition } from "../utils";
import { InfiniteScrollLoader } from "./helpers";
import i18next from "i18next";
import { getPost } from "@/api/hive";
import useMount from "react-use/lib/useMount";
import useUnmount from "react-use/lib/useUnmount";

interface Props {
  id: string;
  settings: WavesDeckGridItem["settings"];
  draggable?: DraggableProvidedDragHandleProps | null;
}

const MAX_ERROR_ATTEMPTS = 3;
const ERROR_ATTEMPTS_INTERVALS: Record<number, number> = {
  0: 3000,
  1: 10000,
  2: 20000,
  3: 30000
};

const DeckThreadsColumnComponent = ({ id, settings, draggable }: Props) => {
  const { register, detach, reloadingInitiated } = useContext(DeckThreadsContext);
  const { fetch } = useContext(DeckThreadsColumnManagerContext);

  const [data, setData] = useState<IdentifiableEntry[]>([]);
  const [hostGroupedData, setHostGroupedData] = useState<Record<string, IdentifiableEntry[]>>(
    AVAILABLE_THREAD_HOSTS.reduce(
      (acc, host) => ({
        ...acc,
        [host]: []
      }),
      {}
    )
  );
  const prevData = usePrevious<IdentifiableEntry[]>(data);

  const [isReloading, setIsReloading] = useState(false);
  const [isFirstLoaded, setIsFirstLoaded] = useState(false);
  const [currentViewingEntry, setCurrentViewingEntry] = useState<IdentifiableEntry | null>(null);
  const [currentHighlightedEntry, setCurrentHighlightedEntry] = useState<string | undefined>(
    undefined
  );
  const [currentEditingEntry, setCurrentEditingEntry] = useState<ThreadItemEntry | null>(null);
  const [isEndReached, setIsEndReached] = useState(false);
  const [hasHostNextPage, setHasHostNextPage] = useState<Record<string, boolean>>(
    AVAILABLE_THREAD_HOSTS.reduce(
      (acc, host) => ({
        ...acc,
        [host]: true
      }),
      {}
    )
  );
  const [nextPageError, setNextPageError] = useState(false);
  const previousEditingEntry = usePrevious(currentEditingEntry);

  const { updateColumnIntervalMs } = useContext(DeckGridContext);

  useMount(() => {
    register(id);
    fetchData();
  });
  useUnmount(() => detach(id));

  const fetchData = useCallback(
    async (sinceEntries?: IdentifiableEntry[], retries = 0) => {
      setNextPageError(false);

      try {
        if (data.length) {
          setIsReloading(true);
        }

        const usingHosts = AVAILABLE_THREAD_HOSTS.filter((h) =>
          settings.host === "all" ? true : h === settings.host
        );
        const response = (await fetch(usingHosts, sinceEntries)) as IdentifiableEntry[];

        let items = [...(sinceEntries ? data : []), ...response];

        items.sort((a, b) => (moment(a.created).isAfter(b.created) ? -1 : 1));

        const nextHostGroupedData = AVAILABLE_THREAD_HOSTS.reduce<Record<string, any>>(
          (acc, host) => ({
            ...acc,
            [host]: items.filter((i) => i.host === host)
          }),
          {}
        );
        setHostGroupedData(nextHostGroupedData);
        setData(items);

        setHasHostNextPage({
          ...hasHostNextPage,
          ...usingHosts.reduce(
            (acc, host) => ({
              ...acc,
              [host]: nextHostGroupedData[host].length > 0
            }),
            {}
          )
        });

        if (response.length === 0 && items.length > 0) {
          setIsEndReached(true);
        }
      } catch (e) {
        if (retries < MAX_ERROR_ATTEMPTS && sinceEntries) {
          setNextPageError(true);
          setTimeout(() => {
            fetchData(sinceEntries, retries + 1);
          }, ERROR_ATTEMPTS_INTERVALS[retries]);
        }
        console.error(e);
      } finally {
        setIsReloading(false);
        setIsFirstLoaded(true);
      }
    },
    [data, fetch, hasHostNextPage, settings.host]
  );

  useEffect(() => {
    if (reloadingInitiated) {
      fetchData();
    }
  }, [fetchData, reloadingInitiated]);

  return (
    <GenericDeckWithDataColumn
      id={id}
      draggable={draggable}
      header={{
        title:
          settings.host === "all"
            ? i18next.t("decks.columns.all-thread-hosts")
            : settings.host.toLowerCase(),
        subtitle: i18next.t("decks.columns.threads"),
        icon: null,
        updateIntervalMs: settings.updateIntervalMs,
        setUpdateIntervalMs: (v) => updateColumnIntervalMs(id, v)
      }}
      data={data}
      newDataComingCondition={(newData) => newDataComingPaginatedCondition(newData, prevData)}
      isReloading={isReloading}
      isVirtualScroll={["ecency.waves", "liketu.moments"].includes(settings.host)}
      isExpanded={!!currentViewingEntry}
      isFirstLoaded={isFirstLoaded}
      onReload={() => fetchData()}
      skeletonItem={<DeckThreadItemSkeleton />}
      contentViewer={
        currentViewingEntry ? (
          <DeckThreadItemViewer
            entry={currentViewingEntry}
            onClose={() => setCurrentViewingEntry(null)}
            backTitle={`${settings.host}`}
            highlightedEntry={currentHighlightedEntry}
          />
        ) : undefined
      }
      afterDataSlot={
        settings.host !== "all" ? (
          <InfiniteScrollLoader
            isEndReached={isEndReached}
            data={data}
            failed={nextPageError}
            endReachedLabel={i18next.t("decks.columns.end-reached")}
          />
        ) : (
          <></>
        )
      }
    >
      {(item: IdentifiableEntry, measure: Function, index: number) => (
        <>
          {currentEditingEntry?.post_id === item.post_id && (
            <DeckThreadEditItem entry={item} onSuccess={() => setCurrentEditingEntry(null)} />
          )}
          <ThreadItem
            visible={item.post_id !== currentEditingEntry?.post_id}
            initialEntry={item}
            onMounted={() => measure()}
            onAppear={() => {
              const hostOnlyThreadItems = hostGroupedData[item.host];
              const isLast = hostOnlyThreadItems[hostOnlyThreadItems.length - 1]?.id === item.id;
              if (isLast && hasHostNextPage[item.host]) {
                fetchData([item.container]);
              }
            }}
            onEntryView={() => setCurrentViewingEntry(item)}
            onResize={() => measure()}
            onEdit={(entry) => setCurrentEditingEntry(entry)}
            onSeeFullThread={async () => {
              try {
                const entry = (await getPost(
                  item.parent_author!,
                  item.parent_permlink!
                )) as IdentifiableEntry;
                if (entry) {
                  entry.id = entry.post_id;
                  entry.host = item.host;
                  setCurrentViewingEntry(entry);
                  setCurrentHighlightedEntry(`${item.author}/${item.permlink}`);
                }
              } catch (e) {}
            }}
            triggerPendingStatus={
              !currentEditingEntry && previousEditingEntry?.post_id === item.post_id
            }
          />
        </>
      )}
    </GenericDeckWithDataColumn>
  );
};

export const DeckThreadsColumn = withDeckThreadsColumnManager(DeckThreadsColumnComponent);
