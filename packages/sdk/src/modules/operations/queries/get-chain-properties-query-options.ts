import { queryOptions } from "@tanstack/react-query";
import { callRPC } from "@/modules/core/hive-tx";

export function getChainPropertiesQueryOptions() {
  return queryOptions({
    queryKey: ["operations", "chain-properties"],
    queryFn: async () => {
      return await callRPC("condenser_api.get_chain_properties", []);
    },
  });
}
