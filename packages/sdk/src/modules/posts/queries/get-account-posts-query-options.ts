import { CONFIG, QueryKeys } from "@/modules/core";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { Entry } from "../types";
import { filterDmcaEntry } from "../utils/filter-dmca-entries";
import { getAccountPosts } from "@/modules/bridge";

type PageParam = {
  author: string | undefined;
  permlink: string | undefined;
  hasNextPage: boolean;
};
type Page = Entry[];

export function getAccountPostsInfiniteQueryOptions(
  username: string | undefined,
  filter = "posts",
  limit = 20,
  observer = "",
  enabled = true
) {
  return infiniteQueryOptions<Page, Error, Page, (string | number)[], PageParam>({
    queryKey: QueryKeys.posts.accountPosts(username ?? "", filter, limit, observer),
    enabled: !!username && enabled,
    initialPageParam: {
      author: undefined,
      permlink: undefined,
      hasNextPage: true,
    } as PageParam,

    queryFn: async ({ pageParam }) => {
      if (!pageParam?.hasNextPage || !username) return [];

      interface AccountPostsParams {
        sort: string;
        account: string;
        limit: number;
        observer?: string;
        start_author?: string;
        start_permlink?: string;
      }

      const rpcParams: AccountPostsParams = {
        sort: filter,
        account: username,
        limit,
        ...(observer && observer.length > 0 ? { observer } : {}),
        ...(pageParam.author ? { start_author: pageParam.author } : {}),
        ...(pageParam.permlink ? { start_permlink: pageParam.permlink } : {}),
      };

      try {
        if (CONFIG.dmcaAccounts && CONFIG.dmcaAccounts.includes(username)) return [];

        const resp = await CONFIG.hiveClient.call(
          "bridge",
          "get_account_posts",
          rpcParams
        );

        if (resp && Array.isArray(resp)) {
          return filterDmcaEntry(resp as Entry[]);
        }
        return [];
      } catch (err) {
        console.error("[SDK] get_account_posts error:", err);
        return [];
      }
    },

    getNextPageParam: (lastPage: Page): PageParam | undefined => {
      const last = lastPage?.[lastPage.length - 1];
      // Only consider there's a next page if we got a full page of results
      // A partial page means we've reached the end
      const hasNextPage = (lastPage?.length ?? 0) === limit;

      if (!hasNextPage) {
        return undefined;
      }

      return {
        author: last?.author,
        permlink: last?.permlink,
        hasNextPage,
      };
    },
  });
}

export function getAccountPostsQueryOptions(
  username: string | undefined,
  filter = "posts",
  start_author: string = "",
  start_permlink: string = "",
  limit = 20,
  observer = "",
  enabled = true
) {
  return queryOptions({
    queryKey: QueryKeys.posts.accountPostsPage(username ?? "", filter, start_author, start_permlink, limit, observer),
    enabled: !!username && enabled,
    queryFn: async () => {
      if (!username) {
        return [];
      }

      const response = await getAccountPosts(
        filter,
        username,
        start_author,
        start_permlink,
        limit,
        observer
      );

      return filterDmcaEntry(response ?? []) as Entry[];
    },
  });
}
