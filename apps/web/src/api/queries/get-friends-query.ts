import {
  getFriendsInfiniteQueryOptions,
  getSearchFriendsQueryOptions,
  FriendsRow,
  FriendSearchResult,
} from "@ecency/sdk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import dayjs from "@/utils/dayjs";

export type { FriendSearchResult };

// App-specific type with formatted lastSeen
export interface FriendsRowFormatted {
  name: string;
  reputation: number;
  lastSeen: string; // Formatted as "X hours ago", "Y days ago", etc.
}

// App-specific type with formatted lastSeen
export interface FriendSearchResultFormatted {
  name: string;
  full_name: string;
  reputation: number;
  lastSeen: string; // Formatted
}

/**
 * Infinite list of friends/followers with formatted timestamps
 */
export const getFriendsQuery = (
  following: string,
  mode: string,
  options?: {
    enabled?: boolean;
    followType?: string;
    limit?: number;
  }
) => {
  const queryOptions = getFriendsInfiniteQueryOptions(
    following,
    mode as "following" | "followers",
    options
  );

  // Transform the data to format timestamps
  const transformedOptions = {
    ...queryOptions,
    select: (data: any) => ({
      ...data,
      pages: data.pages.map((page: FriendsRow[]) =>
        page.map((row) => ({
          ...row,
          lastSeen: dayjs(row.active).fromNow(),
        }))
      ),
    }),
  };

  return {
    ...transformedOptions,
    useClientQuery: () => useInfiniteQuery(transformedOptions),
  };
};

/**
 * One-shot search (non-infinite) with formatted timestamps
 */
export const getSearchFriendsQuery = (username: string, mode: string, query: string) => {
  const queryOptions = getSearchFriendsQueryOptions(
    username,
    mode as "following" | "followers",
    query
  );

  // Transform the data to format timestamps
  const transformedOptions = {
    ...queryOptions,
    select: (data: FriendSearchResult[]) =>
      data.map((result) => ({
        ...result,
        lastSeen: dayjs(result.active).fromNow(),
      })) as FriendSearchResultFormatted[],
  };

  return {
    ...transformedOptions,
    useClientQuery: () => useQuery(transformedOptions),
  };
};
