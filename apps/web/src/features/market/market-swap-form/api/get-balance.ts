import { HiveMarketAsset, MarketAsset } from "../market-pair";
import { ActiveUser, FullAccount } from "@/entities";

export const getBalance = (asset: MarketAsset, activeUser: ActiveUser): string => {
  switch (asset) {
    case HiveMarketAsset.HBD:
      return (activeUser.data as FullAccount).hbd_balance;
    case HiveMarketAsset.HIVE:
      return (activeUser.data as FullAccount).balance;
  }
  return "";
};
