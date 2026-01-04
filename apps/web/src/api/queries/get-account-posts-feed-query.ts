import { getAccountPostsInfiniteQueryOptions, getPostsRankedInfiniteQueryOptions } from "@ecency/sdk";
import { getPromotedEntriesInfiniteQuery } from "@/api/queries/get-promoted-entries-query";
import { prefetchInfiniteQuery, getInfiniteQueryData } from "@/core/react-query";
import { InfiniteData, UseInfiniteQueryResult, useInfiniteQuery } from "@tanstack/react-query";
import { Entry, SearchResponse } from "@/entities";

// Unify all branches on a single page type
type Page = Entry[] | SearchResponse;
type FeedInfinite = InfiniteData<Page, unknown>;

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
