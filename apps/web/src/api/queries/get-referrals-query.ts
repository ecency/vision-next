import { getReferralsInfiniteQueryOptions, getReferralsStatsQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

export const getReferralsQuery = (username: string) => {
  const options = getReferralsInfiniteQueryOptions(username);

  return {
    ...options,
    useClientQuery: () => useInfiniteQuery(options),
  };
};

export const getReferralsStatsQuery = (username: string) => {
  const options = getReferralsStatsQueryOptions(username);

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
