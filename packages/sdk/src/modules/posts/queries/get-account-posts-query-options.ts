import { CONFIG, dmca_accounts } from "@/modules/core";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { Entry } from "../types";
import { resolvePost } from "./get-post-query-options";

type PageParam = {
  author: string | undefined;
  permlink: string | undefined;
  hasNextPage: boolean;
};
type Page = Entry[];

interface AccountPostsParams {
  sort: string;
  account: string;
  limit: number;
  observer?: string;
  start_author?: string;
  start_permlink?: string;
}

export const getAccountPostsQueryOptions = ({
  username,
  filter = "posts",
  limit = 20,
  observer = "",
  enabled = true,
}: {
  username: string | undefined;
  filter?: string;
  limit?: number;
  observer?: string;
  enabled?: boolean;
}) =>
  infiniteQueryOptions({
    queryKey: ["posts", "account-posts", username, filter, limit],
    enabled: !!username && enabled,
    initialData: { pages: [], pageParams: [] },
    initialPageParam: {
      author: undefined,
      permlink: undefined,
      hasNextPage: true,
    } as PageParam,
    queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
      if (!pageParam.hasNextPage || !username) return [];

      const rpcParams: AccountPostsParams = {
        sort: filter,
        account: username,
        limit,
        ...(observer !== undefined ? { observer } : {}),
        ...(pageParam.author ? { start_author: pageParam.author } : {}),
        ...(pageParam.permlink ? { start_permlink: pageParam.permlink } : {}),
      };

      try {
        if (dmca_accounts.includes(username)) return [];

        const resp = (await CONFIG.hiveClient.call(
          "bridge",
          "get_account_posts",
          rpcParams
        )) as Entry[] | null;
        if (resp && Array.isArray(resp)) {
          return Promise.all(resp.map((p) => resolvePost(p, observer)));
        }
        return [];
      } catch (err) {
        return [];
      }
    },

    getNextPageParam: (lastPage: Page): PageParam => {
      const last = lastPage?.[lastPage.length - 1];
      return {
        author: last?.author,
        permlink: last?.permlink,
        hasNextPage: (lastPage?.length ?? 0) > 0,
      };
    },
  });
