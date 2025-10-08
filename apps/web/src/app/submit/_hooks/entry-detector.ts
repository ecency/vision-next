import { EcencyEntriesCacheManagement } from "@/core/caches";
import { Entry } from "@/entities";
import { useEffect, useRef } from "react";
import useMount from "react-use/lib/useMount";

export function useEntryDetector(
  username: string | undefined,
  permlink: string | undefined,
  onEntryDetected: (entry?: Entry) => void
) {
  const attemptToLoad = useRef(false);

  const { data, refetch } = EcencyEntriesCacheManagement.getEntryQueryByPath(
    username?.replace("@", ""),
    permlink
  ).useClientQuery();
  const { data: normalizedEntry } =
    EcencyEntriesCacheManagement.getNormalizedPostQuery(data).useClientQuery();

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
