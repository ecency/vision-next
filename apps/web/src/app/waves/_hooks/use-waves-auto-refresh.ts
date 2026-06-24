import { useEffect, useState } from "react";
import { getWavesLatestFeedQueryOptions } from "@ecency/sdk";
import { WaveEntry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { QueryClient, useQueryClient } from "@tanstack/react-query";

async function fetchLatestWaves(queryClient: QueryClient) {
  const items = (await queryClient.fetchQuery(
    getWavesLatestFeedQueryOptions()
  )) as WaveEntry[];

  return items ?? [];
}

export function useWavesAutoRefresh(latest?: WaveEntry) {
  const [newWaves, setNewWaves] = useState<WaveEntry[]>([]);
  const [now, setNow] = useState(Date.now());
  const queryClient = useQueryClient();

  useEffect(() => {
    let timer: NodeJS.Timeout;

    async function check() {
      setNow(Date.now());

      if (!latest) {
        timer = setTimeout(check, 60000);
        return;
      }

      // Page one of the combined feed is the newest waves across every
      // container; surface the ones newer than the top of the loaded feed.
      const items = await fetchLatestWaves(queryClient);
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
  }, [latest, queryClient]);

  return { newWaves, clear: () => setNewWaves([]), now };
}
