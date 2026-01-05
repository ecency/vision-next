import { getAccountVoteHistoryInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";

export const getAccountVoteHistoryQuery = <F>(
  username: string,
  filters: F[] = [],
  limit = 20
) => {
  const options = getAccountVoteHistoryInfiniteQueryOptions(username, {
    limit,
    filters,
    dayLimit: 7.0,
  });

  return {
    ...options,
    useClientQuery: () => useInfiniteQuery(options),
  };
};
