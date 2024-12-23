import axios from "axios";
import { MarketAsset } from "./market-pair";
import { LRUCache } from 'lru-cache'

const options = {
  max: 500,
  // how long to live in ms
  ttl: 1000 * 60 * 5,
  // return stale items before removing from cache?
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false
}

const cache = new LRUCache(options)
const undefinedValue = Symbol('undefined')
const cacheSet = (key: string, value: any) =>
  cache.set(key, value === undefined ? undefinedValue : value)
const cacheGet = (key: string) => {
  const v = cache.get(key)
  return v === undefinedValue ? undefined : v
}

interface CoinGeckoApiResponse {
  [key: string]: {
    [vsKey: string]: number;
  };
}

export const getCGMarketApi = async (ids: string, vs: string): Promise<CoinGeckoApiResponse> => {
  let rate = cacheGet('gecko');

  if (rate) {
    return rate;
  } else {
    const resp = await axios.get<CoinGeckoApiResponse>(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids,
          vs_currencies: vs
        }
      }
    );
    cacheSet('gecko', resp.data === undefined ? undefinedValue : resp.data);
    return resp.data;
  }
};

const getId = (asset: MarketAsset) => {
  if (asset === MarketAsset.HIVE) return "hive";
  if (asset === MarketAsset.HBD) return "hive_dollar";
  return "";
};

export const getCGMarket = async (
  fromAsset: MarketAsset,
  toAsset: MarketAsset
): Promise<number[]> => {
  let ids = `${getId(fromAsset)},${getId(toAsset)}`;
  const market = await getCGMarketApi(ids, "usd");
  return [market[getId(fromAsset)].usd, market[getId(toAsset)].usd];
};
