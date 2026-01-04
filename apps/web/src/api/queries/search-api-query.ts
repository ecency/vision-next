import { getSearchApiInfiniteQueryOptions, SearchResponse } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";

export type { SearchResponse };

export const getSearchApiQuery = (
  q: string,
  sort: string,
  hideLow: boolean,
  since?: string,
  votes?: number
) => {
  const options = {
    ...getSearchApiInfiniteQueryOptions(q, sort, hideLow, since, votes),
    initialData: { pages: [], pageParams: [] },
  };

  return {
    ...options,
    useClientQuery: () => useInfiniteQuery(options),
  };
};
