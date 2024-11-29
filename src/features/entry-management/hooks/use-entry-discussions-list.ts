import { getDiscussionsQuery } from "@/api/queries";
import { useMemo } from "react";
import { Entry } from "@/entities";

/**
 * Use this hook whenever want to fetch only current entry discussions list
 * Excluding whole discussions tree
 * @param entry
 */
export function useEntryDiscussionsList(entry: Entry) {
  const { data } = getDiscussionsQuery(entry).useClientQuery();

  return useMemo(
    () =>
      data?.filter(
        (x) => x.parent_author === entry.author && x.parent_permlink === entry.permlink
      ) ?? [],
    [data, entry]
  );
}
