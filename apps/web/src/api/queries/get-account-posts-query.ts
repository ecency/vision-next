import { EcencyQueriesManager } from "@/core/react-query";
import { getAccountPostsInfiniteQueryOptions } from "@ecency/sdk";

export const getAccountPostsQuery = (
    username: string | undefined,
    filter = "posts",
    limit = 20,
    observer = "",
    enabled = true
) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery(
        getAccountPostsInfiniteQueryOptions(username, filter, limit, observer, enabled)
    );
