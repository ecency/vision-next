"use client";

import { useMemo } from "react";
import { DetectBottom, SearchListItem } from "@/features/shared";
import i18next from "i18next";
import { getSearchApiQuery } from "@/api/queries";
import { Community, SearchResult } from "@/entities";
import useMount from "react-use/lib/useMount";

interface Props {
    community: Community;
    query?: string;
}

export function CommunityContentSearchData({ query, community }: Props) {
    const q = query ? `${query} category:${community.name}` : "";

    const { data, fetchNextPage, refetch } = getSearchApiQuery(
        q,
        "newest",
        false
    ).useClientQuery();

    const searchData = useMemo(
        () =>
            data?.pages?.reduce<SearchResult[]>(
                (acc, page: any) =>
                    acc
                        .concat(page?.results ?? [])
                        .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)),
                []
            ) ?? [],
        [data?.pages]
    );

    useMount(() => {
        // only refetch if there's an actual query
        if (q) refetch();
    });

    return searchData.length > 0 ? (
        <div className="search-list">
            {searchData.map((res) => (
                <SearchListItem key={`${res.author}-${res.permlink}-${res.id}`} res={res} />
            ))}
            <DetectBottom onBottom={() => fetchNextPage()} />
        </div>
    ) : searchData.length === 0 && query ? (
        i18next.t("g.no-matches")
    ) : null;
}
