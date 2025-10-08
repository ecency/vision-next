import { getAccountPostsQuery } from "@/api/queries/get-account-posts-query";
import { getControversialRisingQuery } from "@/api/queries/get-controversial-rising-query";
import { getPostsRankedQuery } from "@/api/queries/get-posts-ranked-query";
import { getPromotedEntriesInfiniteQuery } from "@/api/queries/get-promoted-entries-query";
import { InfiniteData, UseInfiniteQueryResult } from "@tanstack/react-query";
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
  const isControversial = ["rising", "controversial"].includes(what);
  const isUser = tag.startsWith("@") || tag.startsWith("%40");

  const isAccountPosts = isUser && !isControversial;
  const isControversialPosts = !isUser && isControversial;
  const isPromotedSection = what === "promoted";

  if (isPromotedSection) {
    return getPromotedEntriesInfiniteQuery().prefetch() as Promise<FeedInfinite | undefined>;
  }

  if (isAccountPosts) {
    return getAccountPostsQuery(
        tag.replace("@", "").replace("%40", ""),
        what,
        limit,
        observer ?? "",
        true
    ).prefetch() as Promise<FeedInfinite | undefined>;
  }

  if (isControversialPosts) {
    return getControversialRisingQuery(what, tag).prefetch() as Promise<FeedInfinite | undefined>;
  }

  return getPostsRankedQuery(what, tag, limit, observer ?? "").prefetch() as Promise<
      FeedInfinite | undefined
  >;
}

export function getPostsFeedQueryData(
    what: string,
    tag: string,
    limit = 20,
    observer?: string
): FeedInfinite | undefined {
  const isControversial = ["rising", "controversial"].includes(what);
  const isUser = tag.startsWith("@") || tag.startsWith("%40");

  const isAccountPosts = isUser && !isControversial;
  const isControversialPosts = !isUser && isControversial;
  const isPromotedSection = what === "promoted";

  if (isPromotedSection) {
    return getPromotedEntriesInfiniteQuery().getData() as FeedInfinite | undefined;
  }

  if (isAccountPosts) {
    return getAccountPostsQuery(
        tag.replace("@", "").replace("%40", ""),
        what,
        limit,
        observer ?? "",
        true
    ).getData() as FeedInfinite | undefined;
  }

  if (isControversialPosts) {
    return getControversialRisingQuery(what, tag).getData() as FeedInfinite | undefined;
  }

  return getPostsRankedQuery(what, tag, limit, observer ?? "").getData() as
      | FeedInfinite
      | undefined;
}

export function usePostsFeedQuery(
    what: string,
    tag: string,
    observer?: string,
    limit = 20
): UseInfiniteQueryResult<Page, Error> {
  const isControversial = ["rising", "controversial"].includes(what);
  const isUser = tag.startsWith("@") || tag.startsWith("%40");

  const isAccountPosts = isUser && !isControversial;
  const isControversialPosts = !isUser && isControversial;
  const isPromotedSection = what === "promoted";

  const query =
      isPromotedSection
          ? getPromotedEntriesInfiniteQuery()
          : isAccountPosts
              ? getAccountPostsQuery(
                  tag.replace("@", "").replace("%40", ""),
                  what,
                  limit,
                  observer ?? "",
                  true
              )
              : isControversialPosts
                  ? getControversialRisingQuery(what, tag)
                  : getPostsRankedQuery(what, tag, limit, observer ?? "");

  // unify result type for callers
  return query.useClientQuery() as unknown as UseInfiniteQueryResult<Page, Error>;
}
