import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "@/modules/core";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get chain properties including account creation fee
 */
export function getChainPropertiesQueryOptions() {
  return queryOptions({
    queryKey: QueryKeys.core.chainProperties(),
    queryFn: () => callRPC("condenser_api.get_chain_properties", []),
    staleTime: 5 * 60 * 1000, // 5 minutes - chain properties change rarely
  });
}
