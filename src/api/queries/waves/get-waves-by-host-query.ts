import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import * as bridgeApi from "@/api/bridge";
import { getDiscussionsQuery } from "@/api/queries";
import { ProfileFilter } from "@/enums";
import { Entry, WaveEntry } from "@/entities";

async function getThreads(host: string, pageParam?: WaveEntry) {
  let nextThreadContainers = (
    (await bridgeApi.getAccountPosts(
      ProfileFilter.posts,
      host,
      pageParam?.author,
      pageParam?.permlink,
      1
    )) as WaveEntry[]
  )?.map((c) => {
    c.id = c.post_id;
    c.host = host;
    return c;
  });

  if (!nextThreadContainers || nextThreadContainers.length === 0) {
    return [];
  }

  const [nextThreadContainer] = nextThreadContainers;

  if (nextThreadContainer?.stats?.gray) {
    return getThreads(host, nextThreadContainer);
  }

  const container = nextThreadContainers[0];
  const discussionItems =
    (await getDiscussionsQuery(container).fetchAndGet()) ?? [];

  // If no discussion need to fetch next container
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

export const getWavesByHostQuery = (host: string) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.THREADS, host],
    queryFn: async ({ pageParam }) => {
      const [items, nextThreadContainers] = await getThreads(host, pageParam);

      return items
        .map(
          (item) =>
            ({
              ...item,
              id: item.post_id,
              host,
              container: nextThreadContainers[0],
              parent: items.find(
                (i) =>
                  i.author === item.parent_author &&
                  i.permlink === item.parent_permlink &&
                  i.author !== host
              )
            }) as WaveEntry
        )
        .filter((i) => i.container.post_id !== i.post_id)
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    },
    initialPageParam: undefined as WaveEntry | undefined,
    getNextPageParam: (lastPage) => lastPage[0].container
  });
