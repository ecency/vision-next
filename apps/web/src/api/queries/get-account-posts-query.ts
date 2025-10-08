import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { bridgeApiCall, resolvePost } from "@/api/bridge";
import { Entry } from "@/entities";
import * as Sentry from "@sentry/nextjs";
import dmca_accounts from "@/dmca-accounts.json";
import { parseRpcInfo, RPCError } from "@/utils/rpcmessage";

type PageParam = {
    author: string | undefined;
    permlink: string | undefined;
    hasNextPage: boolean;
};
type Page = Entry[];

export const getAccountPostsQuery = (
    username: string | undefined,
    filter = "posts",
    limit = 20,
    observer = "",
    enabled = true
) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery<Page, PageParam>({
        queryKey: [QueryIdentifiers.GET_POSTS, username, filter, limit],
        enabled: !!username && enabled,
        initialData: { pages: [], pageParams: [] },
        initialPageParam: {
            author: undefined,
            permlink: undefined,
            hasNextPage: true,
        } as PageParam,

        // 👇 type the destructured arg
        queryFn: async ({ pageParam }: { pageParam: PageParam }) => {
            if (!pageParam.hasNextPage || !username) return [];

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
                if (dmca_accounts.includes(username)) return [];

                const resp = await bridgeApiCall<Entry[] | null>("get_account_posts", rpcParams);
                if (resp && Array.isArray(resp)) {
                    return Promise.all(resp.map((p) => resolvePost(p, observer)));
                }
                return [];
            } catch (err) {
                const rpcError = err as RPCError;
                const readableMessage = parseRpcInfo(rpcError.jse_info);

                Sentry.captureException(rpcError, {
                    extra: {
                        rpcMethod: "get_account_posts",
                        username,
                        parsedRpcError: readableMessage ?? undefined,
                        params: rpcParams,
                    },
                    tags: {
                        rpc_category: readableMessage?.includes("does not exist")
                            ? "account_missing"
                            : "other",
                    },
                });

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
