import { QueryIdentifiers, getInfiniteQueryData } from "@/core/react-query";
import * as bridgeApi from "@/api/bridge";
import { ProfileFilter } from "@/enums";
import { WaveEntry } from "@/entities";
import {
  getVisibleFirstLevelThreadItems,
  mapThreadItemsToWaveEntries
} from "./waves-helpers";

const THREAD_CONTAINER_BATCH_SIZE = 5;
const MAX_CONTAINERS_TO_SCAN = 50;

interface ThreadsResult {
  entries: WaveEntry[];
}

async function getThreads(
  host: string,
  pageParam?: WaveEntry
): Promise<ThreadsResult | null> {
  let startAuthor = pageParam?.author;
  let startPermlink = pageParam?.permlink;
  let scannedContainers = 0;
  let skipContainerId = pageParam?.post_id;

  while (scannedContainers < MAX_CONTAINERS_TO_SCAN) {
    const containers = (await bridgeApi.getAccountPosts(
      ProfileFilter.posts,
      host,
      startAuthor,
      startPermlink,
      THREAD_CONTAINER_BATCH_SIZE
    )) as WaveEntry[]; // API shape is known

    if (!containers || containers.length === 0) {
      return null;
    }

    const normalizedContainers = containers.map((container) => {
      container.id = container.post_id;
      container.host = host;
      return container;
    });

    for (const container of normalizedContainers) {
      if (skipContainerId && container.post_id === skipContainerId) {
        skipContainerId = undefined;
        continue;
      }

      scannedContainers += 1;

      if (container.stats?.gray) {
        startAuthor = container.author;
        startPermlink = container.permlink;
        continue;
      }

      const visibleItems = await getVisibleFirstLevelThreadItems(container);

      if (visibleItems.length === 0) {
        startAuthor = container.author;
        startPermlink = container.permlink;
        continue;
      }

      return {
        entries: mapThreadItemsToWaveEntries(visibleItems, container, host)
      };
    }

    const lastContainer = normalizedContainers[normalizedContainers.length - 1];

    if (!lastContainer) {
      return null;
    }

    startAuthor = lastContainer.author;
    startPermlink = lastContainer.permlink;
  }

  return null;
}

// Page = array of WaveEntry; Cursor = WaveEntry (container) or undefined
type WavesPage = WaveEntry[];
type WavesCursor = WaveEntry | undefined;

export const getWavesByHostQuery = (host: string) => {
  const queryKey = [QueryIdentifiers.THREADS, host] as const;
  const cached = getInfiniteQueryData<WavesPage, WavesCursor>({ queryKey });

  return {
    queryKey,
    placeholderData: () => cached,
    refetchOnMount: cached ? ("always" as const) : true,
    initialPageParam: undefined as WavesCursor,

    queryFn: async ({ pageParam }: { pageParam: WavesCursor }) => {
      const result = await getThreads(host, pageParam);
      if (!result) return []; // no items to show for this page

      return result.entries;
    },

    getNextPageParam: (lastPage: WavesPage): WavesCursor => lastPage?.[0]?.container
  };
};
