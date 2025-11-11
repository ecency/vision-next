import axios from "axios";
import { HiveMarketAsset, MarketAsset, isHiveMarketAsset } from "../market-pair";

interface CoinGeckoApiResponse {
  [key: string]: {
    [vsKey: string]: number;
  };
}

export const getCGMarketApi = async (ids: string, vs: string): Promise<CoinGeckoApiResponse> => {
  const resp = await axios.get<CoinGeckoApiResponse>(
    "https://api.coingecko.com/api/v3/simple/price",
    {
      params: {
        ids,
        vs_currencies: vs
      }
    }
  );

  return resp.data;
};

const getId = (asset: MarketAsset) => {
  if (asset === HiveMarketAsset.HIVE) return "hive";
  if (asset === HiveMarketAsset.HBD) return "hive_dollar";
  return "";
};

export const getCGMarket = async (
  fromAsset: MarketAsset,
  toAsset: MarketAsset
): Promise<number[]> => {
  if (!isHiveMarketAsset(fromAsset) || !isHiveMarketAsset(toAsset)) {
    return [0, 0];
  }

  let ids = `${getId(fromAsset)},${getId(toAsset)}`;
  const market = await getCGMarketApi(ids, "usd");
  return [market[getId(fromAsset)].usd, market[getId(toAsset)].usd];
};
