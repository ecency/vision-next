import { EcencyQueriesManager, getQueryClient } from "@/core/react-query";
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
  const enhancedOptions = {
    ...options,
    queryFn: async () => {
      const results = await originalQueryFn();
      EcencyEntriesCacheManagement.updateEntryQueryData(results);
      return results;
    }
  };

  return EcencyQueriesManager.generateClientServerQuery(enhancedOptions);
};

export function addReplyToDiscussionsList(
  entry: Entry,
  reply: Entry,
  order: SortOrder = SortOrder.created,
  queryClient = getQueryClient()
) {
  const queryKey = ["posts", "discussions", entry?.author, entry?.permlink, order, reply.author];
  queryClient.setQueryData<Entry[]>(queryKey, (data) => [...(data ?? []), reply]);
}
