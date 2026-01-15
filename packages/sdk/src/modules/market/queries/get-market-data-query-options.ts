import { queryOptions } from "@tanstack/react-query";
import { MarketData } from "../types";
import { getBoundFetch } from "@/modules/core";

/**
 * Get market chart data from CoinGecko API
 *
 * @param coin - Coin ID (e.g., "hive", "bitcoin")
 * @param vsCurrency - Currency to compare against (e.g., "usd", "eur")
 * @param fromTs - From timestamp (Unix timestamp in seconds)
 * @param toTs - To timestamp (Unix timestamp in seconds)
 */
export function getMarketDataQueryOptions(
  coin: string,
  vsCurrency: string,
  fromTs: string,
  toTs: string
) {
  return queryOptions({
    queryKey: ["market", "data", coin, vsCurrency, fromTs, toTs],
    queryFn: async ({ signal }) => {
      const fetchApi = getBoundFetch();
      const url = `https://api.coingecko.com/api/v3/coins/${coin}/market_chart/range?vs_currency=${vsCurrency}&from=${fromTs}&to=${toTs}`;

      const response = await fetchApi(url, { signal });

      if (!response.ok) {
        throw new Error(`Failed to fetch market data: ${response.status}`);
      }

      return response.json() as Promise<MarketData>;
    },
  });
}
