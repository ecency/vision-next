"use client";

import { DetectBottom, EntryListContent, EntryListContentLoading } from "@/features/shared";
import React, { useMemo } from "react";
import { usePostsFeedQuery } from "@/api/queries";
import { Community, Entry, SearchResponse } from "@/entities";
import type { UseInfiniteQueryResult } from "@tanstack/react-query";

interface Props {
    community: Community;
    section: string;
}

type Page = Entry[] | SearchResponse;

export function CommunityContentInfiniteList({ section, community }: Props) {
    const { fetchNextPage, data, isFetching } =
        usePostsFeedQuery(section, community.name) as UseInfiniteQueryResult<Page, Error>;

    const pageToEntries = (p: Page): Entry[] =>
        Array.isArray(p) ? p : ((p as any).items ?? (p as any).results ?? []);

    const entryList = useMemo(
        () =>
            // Drop first page as it has loaded in a server and shown in RSC
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
            <DetectBottom onBottom={() => fetchNextPage()} />
            {isFetching && <EntryListContentLoading />}
        </>
    );
}
