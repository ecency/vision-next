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

export const getAccountPostsQuery = (
    username: string | undefined,
    filter = "posts",
    limit = 20,
    observer = "",
    enabled = true
) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery({
        queryKey: [QueryIdentifiers.GET_POSTS, username, filter, limit],
        queryFn: async ({ pageParam }) => {
            if (!pageParam.hasNextPage || !username) {
                return [];
            }

            const rpcParams: Record<string, any> = Object.fromEntries(
                Object.entries({
                    sort: filter,
                    account: username,
                    limit,
                    observer,
                    start_author: pageParam.author,
                    start_permlink: pageParam.permlink
                }).filter(([_, v]) => v !== undefined)
            );

            try {
                if (dmca_accounts.includes(username)) {
                    return [];
                }

                const resp = await bridgeApiCall<Entry[] | null>("get_account_posts", rpcParams);

                if (resp && Array.isArray(resp)) {
                    return await Promise.all(resp.map((p) => resolvePost(p, observer)));
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
                        params: rpcParams
                    },
                    tags: {
                        rpc_category: readableMessage?.includes("does not exist") ? "account_missing" : "other"
                    }
                });

                return [];
            }
        },
        enabled: !!username && enabled,
        initialData: { pages: [], pageParams: [] },
        initialPageParam: {
            author: undefined,
            permlink: undefined,
            hasNextPage: true
        } as PageParam,
        getNextPageParam: (lastPage: Entry[]) => {
            const last = lastPage?.[lastPage.length - 1];
            return {
                author: last?.author,
                permlink: last?.permlink,
                hasNextPage: (lastPage?.length ?? 0) > 0
            };
        }
    });
