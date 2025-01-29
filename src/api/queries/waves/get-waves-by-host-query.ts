import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import * as bridgeApi from "@/api/bridge";
import { ProfileFilter } from "@/enums";
import { Entry, WaveEntry } from "@/entities";
import { client } from "@/api/hive";

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

  const items = (await client.call("condenser_api", "get_content_replies", [
    host,
    nextThreadContainers[0].permlink
  ])) as Entry[];
  // const threadItems = await bridgeApi.getDiscussion(host, nextThreadContainers[0].permlink);

  // If no discussion need to fetch next container
  if (items.length === 0) {
    return getThreads(host, nextThreadContainers[0]);
  }

  return [items, nextThreadContainers] as const;
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
