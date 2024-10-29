import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import engine from "@/engine.json";

interface HiveEngineTokenPrice {
  close: number;
  timestamp: number;
}

export const getHiveEngineMarketDataQuery = (symbol: string) =>
  EcencyQueriesManager.generateClientServerQuery({
    queryKey: [QueryIdentifiers.GET_HIVE_ENGINE_MARKET_DATA, symbol],
    queryFn: async () => {
      const { data: history } = await appAxios.get<HiveEngineTokenPrice[]>(
        apiBase(`${engine.chartAPI}`),
        {
          params: { symbol, interval: "daily" }
        }
      );
      return history;
    },
    enabled: !!symbol
  });
