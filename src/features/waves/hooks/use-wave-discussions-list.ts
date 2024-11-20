import { getDiscussionsMapQuery } from "@/api/queries";
import { useCallback, useEffect, useMemo } from "react";
import { WaveEntry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";

export function useWaveDiscussionsList(entry: WaveEntry) {
  const { data: discussions } = getDiscussionsMapQuery(entry).useClientQuery();
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();

  const build = useCallback(
    (dataset: Record<string, WaveEntry>) => {
      const result: WaveEntry[] = [];
      const values = [...Object.values(dataset).filter((v) => v.permlink !== entry?.permlink)];
      Object.entries(dataset)
        .filter(([_, v]) => v.permlink !== entry?.permlink)
        .forEach(([key, value]) => {
          const parent = values.find((v) => v.replies.includes(key));
          if (parent) {
            const existingTempIndex = result.findIndex(
              (v) => v.author === parent.author && v.permlink === parent.permlink
            );
            if (existingTempIndex > -1) {
              result[existingTempIndex].replies.push(value);
              result[existingTempIndex].replies = result[existingTempIndex].replies.filter(
                (r) => r !== key
              );
            } else {
              parent.replies.push(value);
              parent.replies = parent.replies.filter((r) => r !== key);
              result.push(parent);
            }
          } else if (
            result.every((r) => r.author !== value.author && r.permlink !== value.permlink)
          ) {
            result.push(value);
          }
        });
      console.log(result, values);
      return result;
    },
    [entry?.permlink]
  );

  useEffect(() => {
    updateEntryQueryData(Array.from(Object.values(discussions ?? {})));
  }, [discussions, updateEntryQueryData]);

  return useMemo(() => {
    const tempResponse = { ...discussions } as Record<string, WaveEntry>;
    Object.values(tempResponse).forEach((i) => {
      i.host = entry?.host ?? "";
    });

    return build(tempResponse);
  }, [build, discussions, entry?.host]);
}
