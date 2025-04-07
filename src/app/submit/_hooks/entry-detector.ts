import { EcencyEntriesCacheManagement } from "@/core/caches";
import { Entry } from "@/entities";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import useMount from "react-use/lib/useMount";

export function useEntryDetector(
  username: string | undefined,
  permlink: string | undefined,
  onEntryDetected: (entry?: Entry) => void
) {
  const router = useRouter();

  const { data, refetch } = EcencyEntriesCacheManagement.getEntryQueryByPath(
    username?.replace("@", ""),
    permlink
  ).useClientQuery();
  const { data: normalizedEntry, isSuccess } =
    EcencyEntriesCacheManagement.getNormalizedPostQuery(data).useClientQuery();

  useMount(() => refetch());

  useEffect(() => {
    if (!normalizedEntry && isSuccess) {
      return onEntryDetected(undefined);
    }

    if (normalizedEntry) onEntryDetected(normalizedEntry);
  }, [isSuccess, normalizedEntry, onEntryDetected, router]);
}
