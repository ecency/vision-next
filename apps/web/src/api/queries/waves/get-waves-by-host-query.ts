import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import * as bridgeApi from "@/api/bridge";
import { getDiscussionsQuery } from "@/api/queries";
import { ProfileFilter } from "@/enums";
import { Entry, WaveEntry } from "@/entities";

type ThreadsResult = readonly [Entry[], WaveEntry[]];

// runtime guard for discussions
function toEntryArray(x: unknown): Entry[] {
    return Array.isArray(x) ? (x as Entry[]) : [];
}

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

    // ⬇️ Narrow unknown -> Entry[]
    const discussionItemsRaw = await getDiscussionsQuery(container).fetchAndGet();
    const discussionItems = toEntryArray(discussionItemsRaw);

    if (discussionItems.length <= 1) {
        return getThreads(host, container);
    }

    const firstLevelItems = discussionItems.filter(
        ({ parent_author, parent_permlink }) =>
            parent_author === container.author && parent_permlink === container.permlink
    );

    if (firstLevelItems.length === 0) {
        return getThreads(host, container);
    }

    const visibleItems = firstLevelItems.filter((item) => !item.stats?.gray);
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

            return items
                .map((item) => {
                    const container = nextThreadContainers[0];
                    const parent = items.find(
                        (i) =>
                            i.author === item.parent_author &&
                            i.permlink === item.parent_permlink &&
                            i.author !== host
                    );

                    // Build WaveEntry from Entry + extras
                    return {
                        ...item,
                        id: item.post_id,
                        host,
                        container,
                        parent,
                    } as WaveEntry;
                })
                .filter((i) => i.container.post_id !== i.post_id)
                .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
        },

        getNextPageParam: (lastPage: WavesPage): WavesCursor => lastPage?.[0]?.container,
    });
