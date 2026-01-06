import { EcencyEntriesCacheManagement } from "@/core/caches";
import { Entry } from "@/entities";
import { useEffect, useRef } from "react";
import useMount from "react-use/lib/useMount";
import { useQuery } from "@tanstack/react-query";

export function useEntryDetector(
  username: string | undefined,
  permlink: string | undefined,
  onEntryDetected: (entry?: Entry) => void
) {
  const attemptToLoad = useRef(false);

  const { data, refetch } = useQuery(EcencyEntriesCacheManagement.getEntryQueryByPath(
    username?.replace("@", ""),
    permlink
  ));
  const { data: normalizedEntry } =
    useQuery(EcencyEntriesCacheManagement.getNormalizedPostQuery(data));

  useMount(() => refetch());

  useEffect(() => {
    // This construction helps to skip first initial value form the query
    if (!attemptToLoad.current) {
      attemptToLoad.current = true;
      return;
    }
    onEntryDetected(normalizedEntry ?? undefined);
  }, [normalizedEntry, attemptToLoad]);
}
