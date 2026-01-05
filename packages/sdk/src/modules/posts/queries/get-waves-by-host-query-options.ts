import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { WaveEntry } from "../types";
import {
  getVisibleFirstLevelThreadItems,
  mapThreadItemsToWaveEntries
} from "../utils/waves-helpers";

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
    interface AccountPostsParams {
      sort: string;
      account: string;
      limit: number;
      start_author?: string;
      start_permlink?: string;
    }

    const rpcParams: AccountPostsParams = {
      sort: "posts", // ProfileFilter.posts
      account: host,
      limit: THREAD_CONTAINER_BATCH_SIZE,
      ...(startAuthor ? { start_author: startAuthor } : {}),
      ...(startPermlink ? { start_permlink: startPermlink } : {})
    };

    const containers = (await CONFIG.hiveClient.call(
      "bridge",
      "get_account_posts",
      rpcParams
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

export function getWavesByHostQueryOptions(host: string) {
  return infiniteQueryOptions<WavesPage, Error, WavesPage, string[], WavesCursor>({
    queryKey: ["posts", "waves", "by-host", host],
    initialPageParam: undefined as WavesCursor,

    queryFn: async ({ pageParam }: { pageParam: WavesCursor }) => {
      const result = await getThreads(host, pageParam);
      if (!result) return []; // no items to show for this page

      return result.entries;
    },

    getNextPageParam: (lastPage: WavesPage): WavesCursor => lastPage?.[0]?.container
  });
}
