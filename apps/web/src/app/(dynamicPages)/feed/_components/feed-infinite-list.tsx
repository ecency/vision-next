"use client";

import { DetectBottom, EntryListContent } from "@/features/shared";
import React, { useMemo } from "react";
import { usePostsFeedQuery } from "@/api/queries";
import { Entry, SearchResponse } from "@/entities";
import type { UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";

interface Props {
    filter: string;
    tag: string;
    observer?: string;
    now?: number;
}

type Page = Entry[] | SearchResponse;

export function FeedInfiniteList({ filter, tag, observer, now }: Props) {
    // Cast the hook result to an infinite query over Page
    const result = usePostsFeedQuery(filter, tag, observer) as UseInfiniteQueryResult<Page, Error>;
    const { fetchNextPage } = result;
    const data = result.data as InfiniteData<Page, unknown> | undefined;

    const pageToEntries = (p: Page): Entry[] =>
        Array.isArray(p) ? p : ((p as any).items ?? (p as any).results ?? []);

    const entryList = useMemo(
        () =>
            // Drop first page (already rendered via RSC)
            data?.pages?.slice(1).flatMap(pageToEntries) ?? [],
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
                now={now}
            />
            <DetectBottom onBottom={() => fetchNextPage()} />
        </>
    );
}
