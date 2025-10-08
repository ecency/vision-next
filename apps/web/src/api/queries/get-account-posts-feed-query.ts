import { getAccountPostsQuery } from "@/api/queries/get-account-posts-query";
import { getControversialRisingQuery } from "@/api/queries/get-controversial-rising-query";
import { getPostsRankedQuery } from "@/api/queries/get-posts-ranked-query";
import { InfiniteData } from "@tanstack/react-query";
import { Entry, SearchResponse } from "@/entities";
import { getPromotedEntriesInfiniteQuery } from "@/api/queries/get-promoted-entries-query";

export async function prefetchGetPostsFeedQuery(
  what: string,
  tag = "",
  limit = 20,
  observer?: string
): Promise<InfiniteData<Entry[] | SearchResponse> | undefined> {
  const isControversial = ["rising", "controversial"].includes(what);
  const isUser = tag.startsWith("@") || tag.startsWith("%40");

  const isAccountPosts = isUser && !isControversial;
  const isControversialPosts = !isUser && isControversial;
  const isPromotedSection = what === "promoted";

  if (isPromotedSection) {
    return getPromotedEntriesInfiniteQuery().prefetch();
  }

  if (isAccountPosts) {
    return getAccountPostsQuery(
      tag.replace("@", "").replace("%40", ""),
      what,
      limit,
      observer ?? "",
      true
    ).prefetch();
  }

  if (isControversialPosts) {
    return getControversialRisingQuery(what, tag).prefetch();
  }

  return getPostsRankedQuery(what, tag, limit, observer ?? "").prefetch();
}

export function getPostsFeedQueryData(what: string, tag: string, limit = 20, observer?: string) {
  const isControversial = ["rising", "controversial"].includes(what);
  const isUser = tag.startsWith("@") || tag.startsWith("%40");

  const isAccountPosts = isUser && !isControversial;
  const isControversialPosts = !isUser && isControversial;
  const isPromotedSection = what === "promoted";

  if (isPromotedSection) {
    return getPromotedEntriesInfiniteQuery().getData();
  }

  if (isAccountPosts) {
    return getAccountPostsQuery(
      tag.replace("@", "").replace("%40", ""),
      what,
      limit,
      observer ?? "",
      true
    ).getData();
  }

  if (isControversialPosts) {
    return getControversialRisingQuery(what, tag).getData();
  }

  return getPostsRankedQuery(what, tag, limit, observer ?? "").getData();
}

export function usePostsFeedQuery(what: string, tag: string, observer?: string, limit = 20) {
  const isControversial = ["rising", "controversial"].includes(what);
  const isUser = tag.startsWith("@") || tag.startsWith("%40");

  const isAccountPosts = isUser && !isControversial;
  const isControversialPosts = !isUser && isControversial;
  const isPromotedSection = what === "promoted";

  const query = isPromotedSection
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

  return query.useClientQuery();
}
