import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import engine from "@/engine.json";
import { HiveEngineTokenInfo } from "@/entities";

const buildMetricsQuery = (account?: string, symbol?: string) => {
  const query: Record<string, string> = {};

  if (symbol) {
    query.symbol = symbol;
  }

  if (account) {
    query.account = account;
  }

  return query;
};

export const fetchAllHiveEngineTokens = async (
  account?: string,
  symbol?: string
): Promise<HiveEngineTokenInfo[]> => {
  try {
    const response = await appAxios.post<{ result: HiveEngineTokenInfo[] }>(
      apiBase(engine.API),
      {
        jsonrpc: "2.0",
        method: "find",
        params: {
          contract: "market",
          table: "metrics",
          query: buildMetricsQuery(account, symbol)
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
};

export const getAllHiveEngineTokensQuery = (account?: string, symbol?: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.HIVE_ENGINE_ALL_TOKENS, account],
    queryFn: () => fetchAllHiveEngineTokens(account, symbol)
  });
