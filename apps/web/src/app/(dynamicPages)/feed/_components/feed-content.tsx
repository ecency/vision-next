import { EntryListContent } from "@/features/shared";
import React from "react";
import { FeedLayout } from "@/app/(dynamicPages)/feed/_components/feed-layout";
import { getPostsFeedQueryData } from "@/api/queries";
import { Entry } from "@/entities";
import type { InfiniteData } from "@tanstack/react-query";
import type { SearchResponse } from "@/entities";
import { FeedInfiniteList } from "@/app/(dynamicPages)/feed/_components/feed-infinite-list";

type Page = Entry[] | SearchResponse;

interface Props {
  filter: string;
  tag: string;
  observer?: string;
  searchParams: Record<string, string>;
  initialData?: InfiniteData<Page, unknown>;
}

export function FeedContent({
  filter,
  tag,
  observer,
  searchParams,
  initialData
}: Props) {
  const data = initialData ?? getPostsFeedQueryData(filter, tag, 20, observer);

  const noReblog = searchParams["no-reblog"] === "true";

  const entryList = (
    data?.pages?.reduce<Entry[]>((acc, p) => {
      if (p instanceof Array) {
        return [...acc, ...(p as Entry[])];
      }

      // @ts-ignore
      return [...acc, ...(p as { results: Entry[] }).results];
    }, []) ?? []
  ).filter((item) => (noReblog ? !item.reblogged_by : true));

  return (
    <FeedLayout tag={tag} filter={filter} observer={observer}>
      <EntryListContent
        loading={false}
        entries={entryList}
        sectionParam={filter}
        isPromoted={true}
        username=""
      />
      <FeedInfiniteList tag={tag} filter={filter} observer={observer} />
    </FeedLayout>
  );
}
