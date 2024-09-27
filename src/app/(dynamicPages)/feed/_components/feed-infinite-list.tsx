"use client";

import { DetectBottom, EntryListContent } from "@/features/shared";
import React, { useMemo } from "react";
import { usePostsFeedQuery } from "@/api/queries";
import { Entry } from "@/entities";

interface Props {
  filter: string;
  tag: string;
}

export function FeedInfiniteList({ filter, tag }: Props) {
  const { fetchNextPage, data } = usePostsFeedQuery(filter, tag);

  const entryList = useMemo(
    () =>
      // Drop first page as it has loaded in a server and shown in RSC
      data?.pages?.slice(1).reduce<Entry[]>((acc, p) => {
        if (p instanceof Array) {
          return [...acc, ...(p as Entry[])];
        }

        // @ts-ignore
        return [...acc, ...(p as { results: Entry[] }).results];
      }, []) ?? [],
    [data?.pages]
  );

  return (
    <>
      <EntryListContent
        username=""
        loading={false}
        entries={entryList}
        sectionParam={filter}
        isPromoted={false}
        showEmptyPlaceholder={false}
      />
      <DetectBottom onBottom={() => fetchNextPage()} />
    </>
  );
}
