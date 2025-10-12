import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import * as bridgeApi from "@/api/bridge";
import { ProfileFilter } from "@/enums";
import { Entry, WaveEntry } from "@/entities";
import {
  getVisibleFirstLevelThreadItems,
  mapThreadItemsToWaveEntries
} from "./waves-helpers";

type ThreadsResult = readonly [Entry[], WaveEntry[]];

async function getThreads(
    host: string,
    pageParam?: WaveEntry
): Promise<ThreadsResult | null> {
    const containers = (await bridgeApi.getAccountPosts(
        ProfileFilter.posts,
        host,
        pageParam?.author,
        pageParam?.permlink,
        1
    )) as WaveEntry[]; // API shape is known

    let nextThreadContainers = containers?.map((c) => {
        c.id = c.post_id;
        c.host = host;
        return c;
    });

    if (!nextThreadContainers || nextThreadContainers.length === 0) {
        return null;
    }

    const [nextThreadContainer] = nextThreadContainers;

    if (nextThreadContainer?.stats?.gray) {
        return getThreads(host, nextThreadContainer);
    }

    const container = nextThreadContainers[0];

    const visibleItems = await getVisibleFirstLevelThreadItems(container);
    if (visibleItems.length === 0) {
        return getThreads(host, container);
    }

    return [visibleItems, nextThreadContainers] as const;
}

// Page = array of WaveEntry; Cursor = WaveEntry (container) or undefined
type WavesPage = WaveEntry[];
type WavesCursor = WaveEntry | undefined;

export const getWavesByHostQuery = (host: string) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery<WavesPage, WavesCursor>({
        queryKey: [QueryIdentifiers.THREADS, host],
        initialData: { pages: [], pageParams: [] },
        initialPageParam: undefined as WavesCursor,

        queryFn: async ({ pageParam }: { pageParam: WavesCursor }) => {
            const res = await getThreads(host, pageParam);
            if (!res) return []; // no items to show for this page

            const [items, nextThreadContainers] = res;

            const container = nextThreadContainers[0];

            return mapThreadItemsToWaveEntries(items, container, host);
        },

        getNextPageParam: (lastPage: WavesPage): WavesCursor => lastPage?.[0]?.container,
    });
