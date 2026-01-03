import { CONFIG } from "@/modules/core";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { Entry } from "../types";

type PageParam = {
  author: string | undefined;
  permlink: string | undefined;
  hasNextPage: boolean;
};
type Page = Entry[];

// DMCA accounts list
const DMCA_ACCOUNTS: string[] = [];

export function getAccountPostsInfiniteQueryOptions(
  username: string | undefined,
  filter = "posts",
  limit = 20,
  observer = "",
  enabled = true
) {
  return infiniteQueryOptions<Page, Error, Page, (string | number)[], PageParam>({
    queryKey: ["posts", "account-posts", username ?? "", filter, limit],
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
        ...(observer !== undefined ? { observer } : {}),
        ...(pageParam.author ? { start_author: pageParam.author } : {}),
        ...(pageParam.permlink ? { start_permlink: pageParam.permlink } : {}),
      };

      try {
        if (DMCA_ACCOUNTS.includes(username)) return [];

        const resp = await CONFIG.hiveClient.call(
          "bridge",
          "get_account_posts",
          rpcParams
        );

        if (resp && Array.isArray(resp)) {
          return resp as Entry[];
        }
        return [];
      } catch (err) {
        console.error("[SDK] get_account_posts error:", err);
        return [];
      }
    },

    getNextPageParam: (lastPage: Page): PageParam | undefined => {
      const last = lastPage?.[lastPage.length - 1];
      const hasNextPage = (lastPage?.length ?? 0) > 0;

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
