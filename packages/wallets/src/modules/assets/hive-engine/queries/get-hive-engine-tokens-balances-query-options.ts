import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { HiveEngineTokenBalance } from "../types";

export function getHiveEngineTokensBalancesQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "balances", username],
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
              table: "balances",
              query: {
                account: username,
              },
            },
            id: 1,
          }),
          headers: { "Content-type": "application/json" },
        }
      );
      const data = (await response.json()) as {
        result: HiveEngineTokenBalance[];
      };
      return data.result;
    },
  });
}
