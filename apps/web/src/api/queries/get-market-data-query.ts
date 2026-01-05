import { getMarketDataQueryOptions, MarketData } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export type { MarketData };

export const getMarketDataQuery = (
  coin: string,
  vsCurrency: string,
  fromTs: string,
  toTs: string
) => {
  const options = getMarketDataQueryOptions(coin, vsCurrency, fromTs, toTs);

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
