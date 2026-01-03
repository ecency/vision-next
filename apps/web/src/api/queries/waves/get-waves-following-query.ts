import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { apiBase } from "@/api/helper";
import { appAxios } from "@/api/axios";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { Entry, WaveEntry } from "@/entities";
import { normalizeWaveEntryFromApi } from "./waves-helpers";

type WavesFollowingEntry = Entry & {
  post_id: number;
  container?: (Entry & { post_id: number }) | null;
  parent?: (Entry & { post_id: number }) | null;
};

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
    // Don't set initialData here - let it use prefetched data from server
    // initialData: { pages: [], pageParams: [] },
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

        const flattened = data
          .map((entry) => normalizeWaveEntryFromApi(entry, host))
          .filter((entry): entry is WaveEntry => Boolean(entry));

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
