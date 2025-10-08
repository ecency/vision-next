import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

export function getChainPropertiesQueryOptions() {
  return queryOptions({
    queryKey: ["operations", "chain-properties"],
    queryFn: async () => {
      return await CONFIG.hiveClient.database.getChainProperties();
    },
  });
}
