import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { apiBase } from "@/api/helper";
import { appAxios } from "@/api/axios";
import * as bridgeApi from "@/api/bridge";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { WaveEntry } from "@/entities";
import {
  getVisibleFirstLevelThreadItems,
  mapThreadItemsToWaveEntries
} from "./waves-helpers";

interface WavesFollowingEntry {
  author: string;
  permlink: string;
}

export const getWavesFollowingQuery = (host: string, username?: string) => {
  const normalizedUsername = username?.trim().toLowerCase();

  return EcencyQueriesManager.generateClientServerInfiniteQuery<WaveEntry[], void>({
    queryKey: [
      QueryIdentifiers.THREADS,
      host,
      "following",
      normalizedUsername ?? ""
    ],
    enabled: Boolean(normalizedUsername),
    initialPageParam: undefined,
    initialData: { pages: [], pageParams: [] },
    queryFn: async () => {
      if (!normalizedUsername) {
        return [];
      }

      try {
        const { data } = await appAxios.get<WavesFollowingEntry[]>(
          apiBase("/private-api/waves/following"),
          {
            params: {
              container: host,
              username: normalizedUsername
            }
          }
        );

        if (!Array.isArray(data) || data.length === 0) {
          return [];
        }

        const entries = await Promise.all(
          data.map(async ({ author, permlink }) => {
            const containerEntry = await bridgeApi.getPost(author, permlink);

            if (!containerEntry || containerEntry.stats?.gray) {
              return [] as WaveEntry[];
            }

            const container = {
              ...containerEntry,
              id: containerEntry.post_id,
              host
            } as WaveEntry;

            const visibleItems = await getVisibleFirstLevelThreadItems(container);

            if (visibleItems.length === 0) {
              return [] as WaveEntry[];
            }

            return mapThreadItemsToWaveEntries(visibleItems, container, host);
          })
        );

        const flattened = entries.flat();

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

        return flattened.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );
      } catch (error) {
        console.error("Failed to fetch waves following feed", error);
        return [];
      }
    },
    getNextPageParam: () => undefined
  });
};
