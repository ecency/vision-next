import { getHiveHbdStatsQueryOptions, HiveHbdStats } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export type { HiveHbdStats };

export const getHiveHbdStatsQuery = () => {
  const options = getHiveHbdStatsQueryOptions();

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
