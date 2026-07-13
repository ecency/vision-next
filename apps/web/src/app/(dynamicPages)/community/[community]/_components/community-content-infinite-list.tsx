"use client";

import { DetectBottom, EntryListContent, EntryListContentLoading } from "@/features/shared";
import React, { useMemo } from "react";
import { useBottomPagination } from "@/core/hooks";
import { usePostsFeedQuery } from "@/api/queries";
import { Community, Entry, SearchResponse } from "@/entities";
import type { UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";

interface Props {
    community: Community;
    section: string;
}

type FeedPage = Entry[] | SearchResponse;

export function CommunityContentInfiniteList({ section, community }: Props) {
    // ⚠️ Don't destructure the cast; assign first, then read props.
    const result = usePostsFeedQuery(section, community.name) as UseInfiniteQueryResult<FeedPage, Error>;

    const fetchNextPage = result.fetchNextPage;
    const isFetching = result.isFetching;
    const hasNextPage = result.hasNextPage;
    const isFetchingNextPage = result.isFetchingNextPage;

    // Make 'data' explicit: it's InfiniteData<FeedPage, unknown> | undefined
    const data = result.data as InfiniteData<FeedPage, unknown> | undefined;

    const pageToEntries = (p: FeedPage): Entry[] =>
        Array.isArray(p) ? p : ((p as any).items ?? (p as any).results ?? []);

    // This component re-renders when a fetch starts (it reads isFetching),
    // which re-runs DetectBottom's effect while the sentinel is still in
    // viewport — see useBottomPagination for why the naive inline handler
    // aborts its own fetch.
    const onBottom = useBottomPagination({ data, hasNextPage, isFetchingNextPage, fetchNextPage });

    const entryList = useMemo(
        () =>
            // Drop the first page (already rendered on the server)
            (data?.pages?.slice(1)?.flatMap(pageToEntries) ?? []),
        [data?.pages]
    );

    return (
        <>
            <EntryListContent
                username={community.name}
                loading={false}
                entries={entryList}
                sectionParam={section}
                isPromoted={false}
                showEmptyPlaceholder={false}
            />
            <DetectBottom onBottom={onBottom} />
            {isFetching && <EntryListContentLoading />}
        </>
    );
}
