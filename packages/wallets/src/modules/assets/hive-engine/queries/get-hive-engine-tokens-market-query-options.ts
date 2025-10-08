import { queryOptions } from "@tanstack/react-query";
import { HiveEngineMarketResponse } from "../types";
import { CONFIG } from "@ecency/sdk";

export function getHiveEngineTokensMarketQueryOptions() {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "markets"],
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
              contract: "market",
              table: "metrics",
              query: {},
            },
            id: 1,
          }),
          headers: { "Content-type": "application/json" },
        }
      );
      const data = (await response.json()) as {
        result: HiveEngineMarketResponse[];
      };
      return data.result;
    },
  });
}
