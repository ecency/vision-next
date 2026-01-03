import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import engine from "@/engine.json";
import { HiveEngineTokenInfo } from "@/entities";

export const getAllHiveEngineTokensQuery = (account?: string, symbol?: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.HIVE_ENGINE_ALL_TOKENS, account, symbol],
    queryFn: async () => {
    queryFn: async () => {
      try {
        const response = await appAxios.post<{ result: HiveEngineTokenInfo[] }>(
          apiBase(engine.API),
          {
            jsonrpc: "2.0",
            method: "find",
            params: {
              contract: "market",
              table: "metrics",
              query: {
                symbol: symbol,
                account: account
              }
            },
            id: 1
          },
          {
            headers: { "Content-type": "application/json" }
          }
        );
        return response.data.result;
      } catch (e) {
        return [];
      }
    }
  });

export async function fetchAllHiveEngineTokens(account?: string, symbol?: string) {
  return getAllHiveEngineTokensQuery(account, symbol).fetchAndGet();
}
