import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { apiBase } from "@/api/helper";
import { appAxios } from "@/api/axios";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { Entry, WaveEntry } from "@/entities";
import { normalizeWaveEntryFromApi } from "./waves-helpers";

type WavesTagEntryResponse = Entry & {
  post_id: number;
  container?: (Entry & { post_id: number }) | null;
  parent?: (Entry & { post_id: number }) | null;
};

const DEFAULT_TAG_FEED_LIMIT = 40;

export const getWavesByTagQuery = (host: string, tag: string, limit = DEFAULT_TAG_FEED_LIMIT) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery<WaveEntry[], void>({
    queryKey: [QueryIdentifiers.THREADS, host, "tag", tag],
    initialPageParam: undefined,
    initialData: { pages: [], pageParams: [] },
    queryFn: async () => {
      try {
        const { data } = await appAxios.get<WavesTagEntryResponse[]>(
          apiBase("/private-api/waves/tags"),
          {
            params: {
              container: host,
              tag
            }
          }
        );

        const result = data
          .slice(0, limit)
          .map((entry) => normalizeWaveEntryFromApi(entry, host))
          .filter((entry): entry is WaveEntry => Boolean(entry));

        if (result.length > 0) {
          EcencyEntriesCacheManagement.updateEntryQueryData(result);
          const containers = Array.from(
            new Map<string, WaveEntry>(
              result.map((item) => [`${item.container.author}/${item.container.permlink}`, item.container])
            ).values()
          );
          EcencyEntriesCacheManagement.updateEntryQueryData(containers);
        }

        return result.sort(
          (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
        );
      } catch (error) {
        console.error("Failed to fetch waves by tag", error);
        return [];
      }
    },
    getNextPageParam: () => undefined
  });
