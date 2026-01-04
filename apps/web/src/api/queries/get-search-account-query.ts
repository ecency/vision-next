import { getSearchAccountQueryOptions, AccountSearchResult } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export type { AccountSearchResult };

export const getSearchAccountQuery = (q: string, limit = 5, random = false) => {
  const options = getSearchAccountQueryOptions(q, limit, random);

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
