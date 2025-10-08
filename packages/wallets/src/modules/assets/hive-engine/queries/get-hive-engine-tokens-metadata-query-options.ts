import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { HiveEngineTokenMetadataResponse } from "../types";

export function getHiveEngineTokensMetadataQueryOptions(tokens: string[]) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "metadata-list", tokens],
    staleTime: 60000,
    refetchInterval: 90000,
    queryFn: async () => {
      const response = await fetch(
        `${CONFIG.privateApiHost}/private-api/engine-api`,
        {
          method: "POST",
          body: JSON.stringify({
            jsonrpc: "2.0",
            method: "find",
            params: {
              contract: "tokens",
              table: "tokens",
              query: {
                symbol: { $in: tokens },
              },
            },
            id: 2,
          }),
          headers: { "Content-type": "application/json" },
        }
      );
      const data = (await response.json()) as {
        result: HiveEngineTokenMetadataResponse[];
      };
      return data.result;
    },
  });
}
