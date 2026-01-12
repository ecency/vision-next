import { HiveMarketAsset } from "../../market-pair";
import { getMarketStatisticsQueryOptions, getQueryClient } from "@ecency/sdk";

export const getHiveMarketRate = async (asset: HiveMarketAsset): Promise<number> => {
  if (asset === HiveMarketAsset.HIVE) {
    const market = await getQueryClient().fetchQuery(getMarketStatisticsQueryOptions());
    return +market.lowest_ask;
  } else if (asset === HiveMarketAsset.HBD) {
    const market = await getQueryClient().fetchQuery(getMarketStatisticsQueryOptions());
    return 1 / +market.lowest_ask;
  }
  return 0;
};
