import { getHiveEngineTokensMetadata } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { HiveEngineTokenMetadataResponse } from "../types";

export function getHiveEngineTokensMetadataQueryOptions(tokens: string[]) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "metadata-list", tokens] as const,
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      return getHiveEngineTokensMetadata<HiveEngineTokenMetadataResponse>(tokens);
    },
  });
}
