import { EcencyWalletCurrency } from "@/modules/wallets/enums";
import { queryOptions } from "@tanstack/react-query";
import { LRUCache } from "lru-cache";

const options = {
  max: 500,
  // how long to live in ms
  ttl: 1000 * 60 * 5,
  // return stale items before removing from cache?
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
};

const cache = new LRUCache(options);
const undefinedValue = Symbol("undefined");

const cacheSet = (key: string, value: any) =>
  cache.set(key, value === undefined ? undefinedValue : value);

const cacheGet = (key: string) => {
  const v = cache.get(key);
  return v === undefinedValue ? undefined : v;
};

interface CoinGeckoApiResponse {
  [key: string]: {
    [vsKey: string]: number;
  };
}

export function getCoinGeckoPriceQueryOptions(currency?: string) {
  return queryOptions({
    queryKey: ["ecency-wallets", "coingecko-price", currency],
    queryFn: async () => {
      let curr = currency as string;
      switch (currency) {
        case EcencyWalletCurrency.BTC:
          curr = "binance-wrapped-btc";
          break;
        case EcencyWalletCurrency.ETH:
          curr = "ethereum";
          break;
        case EcencyWalletCurrency.SOL:
          curr = "solana";
          break;
        case EcencyWalletCurrency.TON:
          curr = "ton";
          break;
        case EcencyWalletCurrency.TRON:
          curr = "tron";
          break;
        case EcencyWalletCurrency.APT:
          curr = "aptos";
          break;
        case EcencyWalletCurrency.BNB:
          curr = "binancecoin";
          break;
        case EcencyWalletCurrency.TON:
          curr = "the-open-network";
          break;
        default:
          curr = currency as string;
      }

      let rate = cacheGet("gecko");
      let response;
      if (rate) {
        response = rate as CoinGeckoApiResponse;
      } else {
        const httpResponse = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${curr}&vs_currencies=usd`,
          {
            method: "GET",
          }
        );
        const data = (await httpResponse.json()) as CoinGeckoApiResponse;
        cacheSet("gecko", data === undefined ? undefinedValue : data);

        response = data;
      }

      return +response[curr].usd;
    },
    enabled: !!currency,
  });
}
