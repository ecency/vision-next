import { HiveMarketAsset, MarketAsset } from "../market-pair";
import { FullAccount } from "@/entities";

export const getBalance = (asset: MarketAsset, account: FullAccount): string => {
  switch (asset) {
    case HiveMarketAsset.HBD:
      return account.hbd_balance;
    case HiveMarketAsset.HIVE:
      return account.balance;
  }
  return "";
};
