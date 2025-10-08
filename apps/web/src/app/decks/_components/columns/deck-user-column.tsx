import React, { useCallback, useContext, useEffect, useState } from "react";
import { ListItemSkeleton, SearchListItem } from "./deck-items";
import { GenericDeckWithDataColumn } from "./generic-deck-with-data-column";
import { UserDeckGridItem } from "../types";
import { DraggableProvidedDragHandleProps } from "react-beautiful-dnd";
import { USER_CONTENT_TYPES, userTitles } from "../consts";
import { DeckGridContext } from "../deck-manager";
import { DeckPostViewer } from "./content-viewer";
import { DeckContentTypeColumnSettings } from "./deck-column-settings/deck-content-type-column-settings";
import usePrevious from "react-use/lib/usePrevious";
import dayjs from "@/utils/dayjs";
import { newDataComingPaginatedCondition } from "../utils";
import { InfiniteScrollLoader } from "./helpers";
import { Entry } from "@/entities";
import { getAccountPosts } from "@/api/bridge";
import i18next from "i18next";
import useMount from "react-use/lib/useMount";

interface Props {
  id: string;
  settings: UserDeckGridItem["settings"];
  draggable?: DraggableProvidedDragHandleProps | null;
}

type IdentifiableEntry = Entry & Required<Pick<Entry, "id">>;

export const DeckUserColumn = ({ id, settings, draggable }: Props) => {
  const [data, setData] = useState<IdentifiableEntry[]>([]);
  const prevData = usePrevious(data);
  const [isReloading, setIsReloading] = useState(false);
  const [currentViewingEntry, setCurrentViewingEntry] = useState<Entry | null>(null);
  const [isFirstLoaded, setIsFirstLoaded] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  const { updateColumnIntervalMs } = useContext(DeckGridContext);
  const prevSettings = usePrevious(settings);

  useMount(() => {
    fetchData();
  });

  const fetchData = useCallback(
    async (since?: Entry) => {
      if (data.length) {
        setIsReloading(true);
      }

      try {
        const response = await getAccountPosts(
          settings.contentType,
          settings.username,
          since?.author,
          since?.permlink
        );
        let items = response?.map((i) => ({ ...i, id: i.post_id })) ?? [];
        items = items.sort((a, b) => (dayjs(a.created).isAfter(dayjs(b.created)) ? -1 : 1));

        if (items.length === 0) {
          setHasNextPage(false);
        }

        if (since) {
          setData([...data, ...items]);
        } else {
          setData(items ?? []);
        }
      } catch (e) {
      } finally {
        setIsReloading(false);
        setIsFirstLoaded(true);
      }
    },
    [data, settings.contentType, settings.username]
  );

  useEffect(() => {
    if (prevSettings && prevSettings?.contentType !== settings.contentType) {
      setData([]);
      fetchData();
    }
  }, [fetchData, prevSettings, settings.contentType]);

  return (
    <GenericDeckWithDataColumn
      id={id}
      draggable={draggable}
      header={{
        title: "@" + settings.username.toLowerCase(),
        subtitle: userTitles[settings.contentType] ?? i18next.t("decks.user"),
        icon: null,
        updateIntervalMs: settings.updateIntervalMs,
        setUpdateIntervalMs: (v) => updateColumnIntervalMs(id, v),
        additionalSettings: (
          <DeckContentTypeColumnSettings
            contentTypes={USER_CONTENT_TYPES}
            settings={settings}
            id={id}
          />
        )
      }}
      data={data}
      isVirtualScroll={false}
      isExpanded={!!currentViewingEntry}
      isReloading={isReloading}
      isFirstLoaded={isFirstLoaded}
      onReload={() => fetchData()}
      skeletonItem={<ListItemSkeleton />}
      newDataComingCondition={(newData) => newDataComingPaginatedCondition(newData, prevData)}
      contentViewer={
        currentViewingEntry ? (
          <DeckPostViewer
            entry={currentViewingEntry}
            onClose={() => setCurrentViewingEntry(null)}
            backTitle={`@${settings.username}(${userTitles[settings.contentType]})`}
          />
        ) : (
          <></>
        )
      }
      afterDataSlot={<InfiniteScrollLoader data={data} isEndReached={!hasNextPage} />}
    >
      {(item: any, measure: Function, index: number) => (
        <SearchListItem
          onMounted={() => measure()}
          index={index + 1}
          entry={{
            ...item,
            toggleNotNeeded: true
          }}
          {...item}
          onAppear={() => {
            const isLast = data[data.length - 1]?.post_id === item.post_id;
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
