import React, { useCallback, useContext, useEffect, useState } from "react";
import { ListItemSkeleton, SearchListItem } from "./deck-items";
import { GenericDeckWithDataColumn } from "./generic-deck-with-data-column";
import { CommunityDeckGridItem } from "../types";
import { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";
import { COMMUNITY_CONTENT_TYPES, communityTitles } from "../consts";
import { DeckGridContext } from "../deck-manager";
import { DeckPostViewer } from "./content-viewer";
import { DeckContentTypeColumnSettings } from "./deck-column-settings/deck-content-type-column-settings";
import usePrevious from "react-use/lib/usePrevious";
import { newDataComingPaginatedCondition } from "../utils";
import { InfiniteScrollLoader } from "./helpers";
import dayjs from "@/utils/dayjs";
import { Entry } from "@/entities";
import { getPostsRanked } from "@/api/bridge";
import i18next from "i18next";
import useMount from "react-use/lib/useMount";

interface Props {
  id: string;
  settings: CommunityDeckGridItem["settings"];
  draggable?: DraggableProvidedDragHandleProps | null;
}

type IdentifiableEntry = Entry & Required<Pick<Entry, "id">>;

export const DeckCommunityColumn = ({ id, settings, draggable }: Props) => {
  const [data, setData] = useState<IdentifiableEntry[]>([]);
  const prevData = usePrevious(data);
  const [isReloading, setIsReloading] = useState(false);
  const [currentViewingEntry, setCurrentViewingEntry] = useState<Entry | null>(null);
  const [isFirstLoaded, setIsFirstLoaded] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  const { updateColumnIntervalMs } = useContext(DeckGridContext);
  const prevSettings = usePrevious(settings);

  const fetchData = useCallback(
    async (since?: Entry) => {
      if (data.length) {
        setIsReloading(true);
      }

      if (isReloading) {
        return;
      }

      try {
        const response = await getPostsRanked(
          settings.contentType,
          since?.author,
          since?.permlink,
          20,
          settings.tag
        );
        let items = ((response as IdentifiableEntry[] | null) ?? [])
          .filter((e) => !e.stats?.is_pinned)
          .map((i) => ({ ...i, id: i.post_id }));

        items = items.sort((a, b) => (dayjs(a.created).isAfter(dayjs(b.created)) ? -1 : 1));

        if (items.length === 0) {
          setHasNextPage(false);
        }

        if (since) {
          setData([...data, ...items]);
        } else {
          setData(items);
        }
      } catch (e) {
      } finally {
        setIsReloading(false);
        setIsFirstLoaded(true);
      }
    },
    [data, isReloading, settings.contentType, settings.tag]
  );

  useMount(() => {
    fetchData();
  });

  useEffect(() => {
    if (prevSettings && prevSettings?.contentType !== settings.contentType) {
      setData([]);
      fetchData();
    }
  }, [settings.contentType, fetchData, prevSettings]);

  return (
    <GenericDeckWithDataColumn
      id={id}
      draggable={draggable}
      header={{
        title: settings.username.toLowerCase(),
        subtitle: communityTitles[settings.contentType] ?? i18next.t("decks.user"),
        icon: null,
        updateIntervalMs: settings.updateIntervalMs,
        setUpdateIntervalMs: (v) => updateColumnIntervalMs(id, v),
        additionalSettings: (
          <DeckContentTypeColumnSettings
            contentTypes={COMMUNITY_CONTENT_TYPES}
            settings={settings}
            id={id}
          />
        )
      }}
      data={data}
      isVirtualScroll={false}
      isReloading={isReloading}
      isExpanded={!!currentViewingEntry}
      isFirstLoaded={isFirstLoaded}
      onReload={() => fetchData()}
      skeletonItem={<ListItemSkeleton />}
      newDataComingCondition={(nextData) => newDataComingPaginatedCondition(nextData, prevData)}
      afterDataSlot={<InfiniteScrollLoader data={data} isEndReached={!hasNextPage} />}
      contentViewer={
        currentViewingEntry ? (
          <DeckPostViewer
            entry={currentViewingEntry}
            onClose={() => setCurrentViewingEntry(null)}
            backTitle={`${settings.username}(${communityTitles[settings.contentType]})`}
          />
        ) : undefined
      }
    >
      {(item: any, measure: Function, index: number) => (
        <SearchListItem
          index={index + 1}
          entry={{
            ...item,
            toggleNotNeeded: true
          }}
          {...item}
          onMounted={() => measure()}
          onAppear={() => {
            const isLast = data[data.length - 1]?.id === item.id;
            if (isLast && hasNextPage) {
              fetchData(item);
            }
          }}
          onEntryView={() => setCurrentViewingEntry(item)}
        ></SearchListItem>
      )}
    </GenericDeckWithDataColumn>
  );
};
