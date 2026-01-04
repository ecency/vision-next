import { getSearchTopicsQueryOptions, TagSearchResult } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export type { TagSearchResult };

export const getSearchTopicsQuery = (q: string, limit = 20, random = false) => {
  const options = getSearchTopicsQueryOptions(q, limit, random);

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
