import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { HiveEngineTokenInfo } from "../types";

/**
 * Get all Hive Engine tokens with optional filtering by account and symbol
 * @param account - Optional account to filter tokens by
 * @param symbol - Optional symbol to filter tokens by
 */
export function getAllHiveEngineTokensQueryOptions(
  account?: string,
  symbol?: string
) {
  return queryOptions({
    queryKey: ["assets", "hive-engine", "all-tokens", account, symbol] as const,
    queryFn: async () => {
      try {
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
                query: {
                  ...(symbol && { symbol }),
                  ...(account && { account }),
                },
              },
              id: 1,
            }),
            headers: { "Content-type": "application/json" },
          }
        );
        const data = (await response.json()) as {
          result: HiveEngineTokenInfo[];
        };
        return data.result;
      } catch (e) {
        return [];
      }
    },
  });
}
