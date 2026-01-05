import { EcencyEntriesCacheManagement } from "@/core/caches";
import { WaveEntry } from "@/entities";
import { getWavesFollowingQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";

export const getWavesFollowingQuery = (host: string, username?: string) => {
  const options = getWavesFollowingQueryOptions(host, username);

  // Add cache management to queryFn
  const originalQueryFn = options.queryFn;
  const queryOptions = {
    ...options,
    queryFn: async (context: any) => {
      const flattened = await originalQueryFn(context);

      if (flattened.length === 0) {
        return [];
      }

      const uniqueContainers = new Map<string, WaveEntry>();
      flattened.forEach((item) => {
        uniqueContainers.set(
          `${item.container.author}/${item.container.permlink}`,
          item.container
        );
      });

      EcencyEntriesCacheManagement.updateEntryQueryData(flattened);
      EcencyEntriesCacheManagement.updateEntryQueryData(
        Array.from(uniqueContainers.values())
      );

      return flattened;
    },
  };

  return {
    ...queryOptions,
    useClientQuery: () => useInfiniteQuery(queryOptions),
  };
};
