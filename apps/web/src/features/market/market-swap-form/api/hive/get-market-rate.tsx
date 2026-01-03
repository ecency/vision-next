import { HiveMarketAsset } from "../../market-pair";
import { getMarketStatistics } from "@/api/hive";

export const getHiveMarketRate = async (asset: HiveMarketAsset): Promise<number> => {
  if (asset === HiveMarketAsset.HIVE) {
    const market = await getMarketStatistics();
    return +market.lowest_ask;
  } else if (asset === HiveMarketAsset.HBD) {
    const market = await getMarketStatistics();
    return 1 / +market.lowest_ask;
  }
  return 0;
};
