import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import * as bridgeApi from "@/api/bridge";
import { ProfileFilter } from "@/enums";
import { WaveEntry } from "@/entities";

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

  const threadItems = await bridgeApi.getDiscussion(host, nextThreadContainers[0].permlink);

  // If no discussion need to fetch next container
  if (Object.values(threadItems || {}).length === 1) {
    return getThreads(host, nextThreadContainers[0]);
  }

  return [threadItems, nextThreadContainers] as const;
}

export const getWavesByHostQuery = (host: string) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.THREADS, host],
    queryFn: async ({ pageParam }) => {
      const [items, nextThreadContainers] = await getThreads(host, pageParam);
      const flattenThreadItems = Object.values(items ?? {})
        // Filter only parent thread items
        .filter(
          ({ parent_author, parent_permlink }) =>
            parent_author === nextThreadContainers[0].author &&
            parent_permlink === nextThreadContainers[0].permlink
        );

      return flattenThreadItems
        .map(
          (item) =>
            ({
              ...item,
              id: item.post_id,
              host,
              container: nextThreadContainers[0],
              parent: flattenThreadItems.find(
                (i) =>
                  i.author === item.parent_author &&
                  i.permlink === item.parent_permlink &&
                  i.author !== host
              )
            }) as WaveEntry
        )
        .filter((i) => i.container.post_id !== i.post_id);
    },
    initialPageParam: undefined as WaveEntry | undefined,
    getNextPageParam: (lastPage) => lastPage[lastPage.length - 1]
  });
