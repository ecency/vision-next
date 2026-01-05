import { EcencyEntriesCacheManagement } from "@/core/caches";
import { WaveEntry } from "@/entities";
import { getWavesByTagQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";

const DEFAULT_TAG_FEED_LIMIT = 40;

export const getWavesByTagQuery = (host: string, tag: string, limit = DEFAULT_TAG_FEED_LIMIT) => {
  const options = getWavesByTagQueryOptions(host, tag, limit);

  // Add cache management to queryFn
  const originalQueryFn = options.queryFn;
  const queryOptions = {
    ...options,
    queryFn: async (context: any) => {
      const result = await originalQueryFn(context);

      if (result.length > 0) {
        EcencyEntriesCacheManagement.updateEntryQueryData(result);
        const containers = Array.from(
          new Map<string, WaveEntry>(
            result.map((item) => [`${item.container.author}/${item.container.permlink}`, item.container])
          ).values()
        );
        EcencyEntriesCacheManagement.updateEntryQueryData(containers);
      }

      return result;
    },
  };

  return {
    ...queryOptions,
    useClientQuery: () => useInfiniteQuery(queryOptions),
  };
};
