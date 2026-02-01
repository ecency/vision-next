"use client";

import React, { useMemo } from "react";
import {
    DetectBottom,
    EntryListContent,
    EntryListLoadingItem,
    LinearProgress
} from "@/features/shared";
import { ProfileCover } from "@/app/(dynamicPages)/profile/[username]/_components/profile-cover";
import { getAccountVoteHistoryInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import { utils } from "@hiveio/dhive";
import { Account, Entry } from "@/entities";
import type { UseInfiniteQueryResult, InfiniteData } from "@tanstack/react-query";

interface Props {
    section: string;
    account: Account;
}

const limit = 20;
const days = 7.0;

// matches the page shape returned by getAccountVoteHistoryQuery
type VoteHistoryPage = {
    lastDate: number;
    lastItemFetched: number;
    entries: Entry[];
};

export function CurationTrail({ account, section }: Props) {
    // Create filters with BigInt polyfill fallback for older browsers
    const filters = useMemo(() => {
        try {
            // Try to create the bitmask filter (requires BigInt support)
            return utils.makeBitMaskFilter([utils.operationOrders.vote]);
        } catch (error) {
            // Fallback for browsers without BigInt support (Safari < 14, older browsers)
            // Using empty array means no filter - will return all operations,
            // but the query still filters for votes in the result processing
            console.warn("BigInt not supported, using fallback filter", error);
            return [];
        }
    }, []);

    // cast the hook result to an infinite query over VoteHistoryPage
    const result = useInfiniteQuery(
        getAccountVoteHistoryInfiniteQueryOptions(account.name, {
            limit,
            filters,
            dayLimit: days
        })
    ) as UseInfiniteQueryResult<VoteHistoryPage, Error>;

    const { isLoading, fetchNextPage } = result;
    const data = result.data as InfiniteData<VoteHistoryPage, unknown> | undefined;

    const entries = useMemo(
        () => data?.pages?.reduce<Entry[]>((acc, page) => acc.concat(page.entries), []) ?? [],
        [data?.pages]
    );

    const hasMore = useMemo(
        () => (data?.pages?.length ? data.pages[data.pages.length - 1].lastDate : 0) <= days,
        [data?.pages]
    );

    return (
        <>
            <ProfileCover account={account} />
            <EntryListContent
                username={account.name}
                loading={isLoading}
                isPromoted={false}
                sectionParam={section}
                entries={entries}
            />
            {isLoading && (
                <>
                    <EntryListLoadingItem />
                    <LinearProgress />
                </>
            )}
            <DetectBottom
                onBottom={() => {
                    if (!isLoading && hasMore) {
                        fetchNextPage();
                    }
                }}
            />
        </>
    );
}
