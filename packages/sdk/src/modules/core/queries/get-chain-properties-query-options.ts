import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";

/**
 * Get chain properties including account creation fee
 */
export function getChainPropertiesQueryOptions() {
  return queryOptions({
    queryKey: QueryKeys.core.chainProperties(),
    queryFn: () => CONFIG.hiveClient.database.getChainProperties(),
    refetchOnMount: true,
  });
}
