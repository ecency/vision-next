import { EcencyQueriesManager } from "@/core/react-query";
import { getPostsRankedInfiniteQueryOptions } from "@ecency/sdk";

interface GetPostsRankedOptions {
  resolvePosts?: boolean;
}

export const getPostsRankedQuery = (
  sort: string,
  tag: string,
  limit = 20,
  observer = "",
  enabled = true,
  options: GetPostsRankedOptions = {}
) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery(
    getPostsRankedInfiniteQueryOptions(sort, tag, limit, observer, enabled, options)
  );
