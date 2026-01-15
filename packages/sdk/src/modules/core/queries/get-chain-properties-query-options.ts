import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";

/**
 * Get chain properties including account creation fee
 */
export function getChainPropertiesQueryOptions() {
  return queryOptions({
    queryKey: ["core", "chain-properties"],
    queryFn: () => CONFIG.hiveClient.database.getChainProperties(),
    refetchOnMount: true,
  });
}
