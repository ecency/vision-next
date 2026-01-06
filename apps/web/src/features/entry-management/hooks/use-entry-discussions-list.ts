import { getDiscussionsQueryOptions } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Entry } from "@/entities";

/**
 * Use this hook whenever want to fetch only current entry discussions list
 * Excluding whole discussions tree
 * @param entry
 */
export function useEntryDiscussionsList(entry: Entry) {
  const { data } = useQuery(getDiscussionsQueryOptions(entry));

  return useMemo(
    () =>
      data?.filter(
        (x) => x.parent_author === entry.author && x.parent_permlink === entry.permlink
      ) ?? [],
    [data, entry]
  );
}
