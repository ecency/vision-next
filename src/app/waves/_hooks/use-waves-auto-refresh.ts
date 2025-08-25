import { useEffect, useState } from "react";
import * as bridgeApi from "@/api/bridge";
import { ProfileFilter } from "@/enums";
import { Entry, WaveEntry } from "@/entities";
import { client } from "@/api/hive";
import { EcencyEntriesCacheManagement } from "@/core/caches";

async function fetchLatestWaves(host: string) {
  let containers = (
    (await bridgeApi.getAccountPosts(
      ProfileFilter.posts,
      host,
      undefined,
      undefined,
      1
    )) as WaveEntry[]
  )?.map((c) => ({ ...c, id: c.post_id, host }));

  if (!containers || containers.length === 0) {
    return [] as WaveEntry[];
  }

  const items = (await client.call(
    "condenser_api",
    "get_content_replies",
    [host, containers[0].permlink]
  )) as Entry[];

  if (items.length === 0) {
    return [] as WaveEntry[];
  }

  return items
    .map(
      (item) =>
        ({
          ...item,
          id: item.post_id,
          host,
          container: containers[0],
          parent: items.find(
            (i) =>
              i.author === item.parent_author &&
              i.permlink === item.parent_permlink &&
              i.author !== host
          )
        }) as WaveEntry
    )
    .filter((i) => i.container.post_id !== i.post_id)
    .sort(
      (a, b) =>
        new Date(b.created).getTime() - new Date(a.created).getTime()
    );
}

export function useWavesAutoRefresh(latest?: WaveEntry) {
  const [newWaves, setNewWaves] = useState<WaveEntry[]>([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function check() {
      setNow(Date.now());

      if (!latest) {
        timer = setTimeout(check, 60000);
        return;
      }

      const items = await fetchLatestWaves(latest.host);
      EcencyEntriesCacheManagement.updateEntryQueryData(items);
      const latestTime = new Date(latest.created).getTime();
      const fresh = items.filter(
        (i) => new Date(i.created).getTime() > latestTime
      );

      if (fresh.length > 0) {
        setNewWaves(fresh);
      }

      timer = setTimeout(check, 60000);
    }

    check();

    return () => clearTimeout(timer);
  }, [latest]);

  return { newWaves, clear: () => setNewWaves([]), now };
}

