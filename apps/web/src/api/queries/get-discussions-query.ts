import { getQueryClient } from "@/core/react-query";
import { Entry } from "@/entities";
import { SortOrder } from "@/enums";
import { EcencyEntriesCacheManagement } from "@/core/caches";
import { getDiscussionsQueryOptions, SortOrder as SDKSortOrder } from "@ecency/sdk";

// Map app SortOrder to SDK SortOrder
function mapSortOrder(order: SortOrder): SDKSortOrder {
  return order as unknown as SDKSortOrder;
}

export const getDiscussionsQuery = (
  entry: Entry,
  order: SortOrder = SortOrder.created,
  enabled: boolean = true,
  observer?: string
) => {
  const options = getDiscussionsQueryOptions(entry, mapSortOrder(order), enabled, observer);

  // Add cache management to queryFn
  const originalQueryFn = options.queryFn;
  return {
    ...options,
    queryFn: async () => {
      const results = await originalQueryFn();
      EcencyEntriesCacheManagement.updateEntryQueryData(results);
      return results;
    }
  };
};

export function addReplyToDiscussionsList(
  entry: Entry,
  reply: Entry,
  order: SortOrder = SortOrder.created,
  queryClient = getQueryClient()
) {
  const options = getDiscussionsQueryOptions(entry, mapSortOrder(order), true, entry?.author);
  queryClient.setQueryData<Entry[]>(options.queryKey, (data) => [...(data ?? []), reply]);
}
