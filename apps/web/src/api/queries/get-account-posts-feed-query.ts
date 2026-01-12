import { getAccountPostsInfiniteQueryOptions, getPostsRankedInfiniteQueryOptions } from "@ecency/sdk";
import { prefetchInfiniteQuery, getInfiniteQueryData, QueryIdentifiers } from "@/core/react-query";
import { InfiniteData, UseInfiniteQueryResult, useInfiniteQuery, infiniteQueryOptions } from "@tanstack/react-query";
import { Entry, SearchResponse } from "@/entities";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";

// Unify all branches on a single page type
type Page = Entry[] | SearchResponse;
type FeedInfinite = InfiniteData<Page, unknown>;

// Helper function to create promoted entries infinite query
// This wraps the SDK query in an infinite query shape for feed compatibility
type PromotedPage = Entry[];
type PromotedCursor = "empty" | "fetched";

function getPromotedEntriesInfiniteQuery() {
  return infiniteQueryOptions({
    queryKey: [QueryIdentifiers.PROMOTED_ENTRIES, "infinite"],
    initialPageParam: "empty" as PromotedCursor,
    queryFn: async ({ pageParam }: { pageParam: PromotedCursor }) => {
      if (pageParam === "fetched") return [];
      const response = await appAxios.get<Entry[]>(
        apiBase(`/private-api/promoted-entries`)
      );
      return response.data;
    },
    getNextPageParam: (
      _lastPage: PromotedPage,
      _allPages: PromotedPage[],
      _lastPageParam: PromotedCursor
    ): PromotedCursor => "fetched"
  });
}

export async function prefetchGetPostsFeedQuery(
    what: string,
    tag = "",
    limit = 20,
    observer?: string
): Promise<FeedInfinite | undefined> {
  const isUser = tag.startsWith("@") || tag.startsWith("%40");
  const isAccountPosts = isUser;
  const isPromotedSection = what === "promoted";

  if (isPromotedSection) {
    return prefetchInfiniteQuery(getPromotedEntriesInfiniteQuery()) as Promise<FeedInfinite | undefined>;
  }

  if (isAccountPosts) {
    return prefetchInfiniteQuery(
      getAccountPostsInfiniteQueryOptions(
        tag.replace("@", "").replace("%40", ""),
        what,
        limit,
        observer ?? "",
        true
      )
    ) as Promise<FeedInfinite | undefined>;
  }

  if (what === "feed") {
    return prefetchInfiniteQuery(
      getPostsRankedInfiniteQueryOptions(
        what,
        tag,
        limit,
        observer ?? "",
        true,
        { resolvePosts: false }
      )
    ) as Promise<FeedInfinite | undefined>;
  }

  return prefetchInfiniteQuery(
    getPostsRankedInfiniteQueryOptions(what, tag, limit, observer ?? "")
  ) as Promise<FeedInfinite | undefined>;
}

export function getPostsFeedQueryData(
    what: string,
    tag: string,
    limit = 20,
    observer?: string
): FeedInfinite | undefined {
  const isUser = tag.startsWith("@") || tag.startsWith("%40");
  const isAccountPosts = isUser;
  const isPromotedSection = what === "promoted";

  if (isPromotedSection) {
    return getInfiniteQueryData(getPromotedEntriesInfiniteQuery()) as FeedInfinite | undefined;
  }

  if (isAccountPosts) {
    return getInfiniteQueryData(
      getAccountPostsInfiniteQueryOptions(
        tag.replace("@", "").replace("%40", ""),
        what,
        limit,
        observer ?? "",
        true
      )
    ) as FeedInfinite | undefined;
  }

  if (what === "feed") {
    return getInfiniteQueryData(
      getPostsRankedInfiniteQueryOptions(
        what,
        tag,
        limit,
        observer ?? "",
        true,
        { resolvePosts: false }
      )
    ) as FeedInfinite | undefined;
  }

  return getInfiniteQueryData(
    getPostsRankedInfiniteQueryOptions(what, tag, limit, observer ?? "")
  ) as FeedInfinite | undefined;
}

export function usePostsFeedQuery(
    what: string,
    tag: string,
    observer?: string,
    limit = 20
): UseInfiniteQueryResult<Page, Error> {
  const isUser = tag.startsWith("@") || tag.startsWith("%40");
  const isAccountPosts = isUser;
  const isPromotedSection = what === "promoted";

  const queryOptions =
      isPromotedSection
          ? getPromotedEntriesInfiniteQuery()
          : isAccountPosts
              ? getAccountPostsInfiniteQueryOptions(
                  tag.replace("@", "").replace("%40", ""),
                  what,
                  limit,
                  observer ?? "",
                  true
              )
              : getPostsRankedInfiniteQueryOptions(
                    what,
                    tag,
                    limit,
                    observer ?? "",
                    true,
                    what === "feed" ? { resolvePosts: false } : undefined
                );

  // unify result type for callers
  return useInfiniteQuery(queryOptions) as unknown as UseInfiniteQueryResult<Page, Error>;
}
