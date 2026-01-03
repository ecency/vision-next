import { CONFIG } from "@/modules/core";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { Entry } from "../types";

type PageParam = {
  author: string | undefined;
  permlink: string | undefined;
  hasNextPage: boolean;
};

interface GetPostsRankedOptions {
  resolvePosts?: boolean;
}

export function getPostsRankedInfiniteQueryOptions(
  sort: string,
  tag: string,
  limit = 20,
  observer = "",
  enabled = true,
  _options: GetPostsRankedOptions = {}
) {
  return infiniteQueryOptions<Entry[], Error, Entry[], (string | number)[], PageParam>({
    queryKey: ["posts", "posts-ranked", sort, tag, limit, observer],
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      if (!pageParam.hasNextPage) {
        return [];
      }

      let sanitizedTag = tag;
      if (CONFIG.dmcaTags.some((rx: string) => new RegExp(rx).test(tag))) {
        sanitizedTag = "";
      }

      const response = await CONFIG.hiveClient.call("bridge", "get_ranked_posts", {
        sort,
        start_author: pageParam.author,
        start_permlink: pageParam.permlink,
        limit,
        tag: sanitizedTag,
        observer,
      });

      if (response && Array.isArray(response)) {
        const data = response as Entry[];

        // Sort by created date unless it's "hot"
        const sorted =
          sort === "hot"
            ? data
            : data.sort(
                (a, b) =>
                  new Date(b.created).getTime() - new Date(a.created).getTime()
              );

        // Handle pinned entries
        const pinnedEntry = sorted.find((s) => s.stats?.is_pinned);
        const nonPinnedEntries = sorted.filter((s) => !s.stats?.is_pinned);

        return [pinnedEntry, ...nonPinnedEntries].filter((s) => !!s) as Entry[];
      }

      return [];
    },
    enabled,
    initialPageParam: {
      author: undefined,
      permlink: undefined,
      hasNextPage: true,
    } as PageParam,
    getNextPageParam: (lastPage: Entry[]) => {
      const last = lastPage?.[lastPage.length - 1];
      return {
        author: last?.author,
        permlink: last?.permlink,
        hasNextPage: (lastPage?.length ?? 0) > 0,
      };
    },
  });
}
