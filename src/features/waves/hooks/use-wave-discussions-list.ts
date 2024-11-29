import { getDiscussionsMapQuery } from "@/api/queries";
import { useCallback, useEffect, useMemo } from "react";
import { WaveEntry } from "@/entities";
import { EcencyEntriesCacheManagement } from "@/core/caches";

export function useWaveDiscussionsList(entry: WaveEntry) {
  const { data: discussions } = getDiscussionsMapQuery(entry).useClientQuery();
  const { updateEntryQueryData } = EcencyEntriesCacheManagement.useUpdateEntry();

  const build = useCallback(
    (dataset: Record<string, WaveEntry>) => {
      const values = [...Object.values(dataset).filter((v) => v.permlink !== entry?.permlink)];

      const discussions = Object.entries(dataset)
        .filter(([_, v]) => v.permlink !== entry?.permlink)
        .reduce(
          (acc, [key, value]) => {
            const parent = values.find((v) => v.replies.includes(key));
            if (parent) {
              const parentKey = `${parent.author}/${parent.permlink}`;
              return {
                ...acc,
                [parentKey]: {
                  ...parent,
                  replies: [...parent.replies, value]
                }
              };
            }

            return {
              ...acc,
              [key]: value
            };
          },
          {} as Record<string, WaveEntry>
        );

      return Object.values(discussions);
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
