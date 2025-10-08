import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { Entry } from "@/entities";
import { bridgeApiCall, resolvePost } from "@/api/bridge";
import dmca from "@/dmca-tags.json";

type PageParam = { author: string | undefined; permlink: string | undefined; hasNextPage: boolean };

export const getPostsRankedQuery = (
  sort: string,
  tag: string,
  limit = 20,
  observer = "",
  enabled = true
) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.GET_POSTS_RANKED, sort, tag, limit, observer],
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      if (!pageParam.hasNextPage) {
        return [];
      }
      if (
        dmca.some((rx: string) => new RegExp(rx).test(`${tag}`))
      ) {
        tag = "";
      }
      const response = await bridgeApiCall<Entry[] | null>("get_ranked_posts", {
        sort,
        start_author: pageParam.author,
        start_permlink: pageParam.permlink,
        limit,
        tag,
        observer
      });

      if (response) {
        const data = await Promise.all(response.map((item) => resolvePost(item, observer)));
        const sorted =
          sort === "hot"
            ? data
            : data.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        const pinnedEntry = sorted.find((s) => s.stats?.is_pinned);
        const nonPinnedEntries = sorted.filter((s) => !s.stats?.is_pinned);
        return [pinnedEntry, ...nonPinnedEntries].filter((s) => !!s) as Entry[];
      }

      return [];
    },
    enabled,
    initialData: { pages: [], pageParams: [] },
    initialPageParam: { author: undefined, permlink: undefined, hasNextPage: true } as PageParam,
    getNextPageParam: (lastPage: Entry[]) => {
      const last = lastPage?.[lastPage!.length - 1];
      return {
        author: last?.author,
        permlink: last?.permlink,
        hasNextPage: (lastPage?.length ?? 0) > 0
      };
    }
  });
