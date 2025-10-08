"use client";

import { useMemo } from "react";
import { DetectBottom, SearchListItem } from "@/features/shared";
import i18next from "i18next";
import { getSearchApiQuery } from "@/api/queries";
import { Community, SearchResult } from "@/entities";
import useMount from "react-use/lib/useMount";
import type { InfiniteData } from "@tanstack/react-query";

interface Props {
    community: Community;
    query?: string;
}

// runtime guard to detect InfiniteData
function isInfinite<TPage>(d: unknown): d is InfiniteData<TPage, unknown> {
    return !!d && typeof d === "object" && "pages" in (d as any);
}

export function CommunityContentSearchData({ query, community }: Props) {
    const q = query ? `${query} category:${community.name}` : "";

    const result = getSearchApiQuery(q, "newest", false).useClientQuery();
    const { data, fetchNextPage, refetch, hasNextPage, isFetchingNextPage } = result;

    // Normalize to an array of pages regardless of shape
    const pages = useMemo(() => {
        const d = data as unknown;
        if (isInfinite<any>(d)) return d.pages ?? [];
        return d ? [d] : [];
    }, [data]);

    const searchData = useMemo<SearchResult[]>(
        () =>
            pages
                .flatMap((p: any) => p?.results ?? [])
                .sort(
                    (a: SearchResult, b: SearchResult) =>
                        Date.parse(b.created_at) - Date.parse(a.created_at)
                ),
        [pages]
    );

    useMount(() => {
        if (q) refetch();
    });

    if (searchData.length > 0) {
        return (
            <div className="search-list">
                {searchData.map((res) => (
                    <SearchListItem key={`${res.author}-${res.permlink}-${res.id}`} res={res} />
                ))}
                {hasNextPage && !isFetchingNextPage && (
                    <DetectBottom onBottom={() => fetchNextPage()} />
                )}
            </div>
        );
    }

    if (searchData.length === 0 && query) {
        return <>{i18next.t("g.no-matches")}</>;
    }

    return null;
}
