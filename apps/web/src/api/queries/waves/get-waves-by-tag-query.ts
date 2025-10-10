import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { apiBase } from "@/api/helper";
import { appAxios } from "@/api/axios";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import * as bridgeApi from "@/api/bridge";
import { WaveEntry } from "@/entities";

interface WavesTagEntryResponse {
  id: number;
  author: string;
  permlink: string;
}

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

        const containerCache = new Map<string, WaveEntry>();
        const entries = await Promise.all(
          data
            .slice(0, limit)
            .map(async ({ author, permlink }) => {
              const entry = await bridgeApi.getPost(author, permlink);

              if (!entry) {
                return undefined;
              }

              let container: WaveEntry | undefined;
              const containerKey = `${entry.parent_author}/${entry.parent_permlink}`;

              if (entry.parent_author && entry.parent_permlink) {
                container = containerCache.get(containerKey);

                if (!container) {
                  const containerEntry = await bridgeApi.getPost(
                    entry.parent_author,
                    entry.parent_permlink
                  );

                  if (containerEntry) {
                    container = {
                      ...containerEntry,
                      id: containerEntry.post_id,
                      host
                    } as WaveEntry;
                    containerCache.set(containerKey, container);
                  }
                }
              }

              const waveEntry: WaveEntry = {
                ...entry,
                id: entry.post_id,
                host,
                container: container ?? ({ ...entry, id: entry.post_id, host } as WaveEntry)
              };

              return waveEntry;
            })
        );

        const result = entries.filter((entry): entry is WaveEntry => Boolean(entry));

        if (result.length > 0) {
          EcencyEntriesCacheManagement.updateEntryQueryData(result);
          const containers = Array.from(containerCache.values());
          if (containers.length > 0) {
            EcencyEntriesCacheManagement.updateEntryQueryData(containers);
          }
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
