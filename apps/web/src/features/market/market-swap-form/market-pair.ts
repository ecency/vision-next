export enum HiveMarketAsset {
  HIVE = "HIVE",
  HBD = "HBD"
}

export const SWAP_HIVE = "SWAP.HIVE" as const;

export type MarketAsset = HiveMarketAsset | typeof SWAP_HIVE | string;

export const MarketPairs: Record<HiveMarketAsset, HiveMarketAsset[]> = {
  [HiveMarketAsset.HBD]: [HiveMarketAsset.HIVE, HiveMarketAsset.HBD],
  [HiveMarketAsset.HIVE]: [HiveMarketAsset.HIVE, HiveMarketAsset.HBD]
};

export const CORE_MARKET_ASSETS: HiveMarketAsset[] = [HiveMarketAsset.HIVE, HiveMarketAsset.HBD];

export const isHiveMarketAsset = (asset: MarketAsset): asset is HiveMarketAsset =>
  asset === HiveMarketAsset.HIVE || asset === HiveMarketAsset.HBD;

export const isSwapHiveAsset = (asset: MarketAsset): asset is typeof SWAP_HIVE => asset === SWAP_HIVE;

export const isEngineToken = (asset: MarketAsset): boolean =>
  !isHiveMarketAsset(asset) && asset !== SWAP_HIVE;

export const isEnginePair = (fromAsset: MarketAsset, toAsset: MarketAsset) => {
  if (isHiveMarketAsset(fromAsset) && isHiveMarketAsset(toAsset)) {
    return false;
  }

  const involvesSwapHive = isSwapHiveAsset(fromAsset) || isSwapHiveAsset(toAsset);
  const involvesEngineToken = isEngineToken(fromAsset) || isEngineToken(toAsset);

  return involvesSwapHive && involvesEngineToken;
};
