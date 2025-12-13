import React, { useEffect } from "react";
import { MarketAsset } from "@/api/market-pair";
import { useActiveAccount } from "@/core/hooks/use-active-account";

interface Props {
  fromAsset: MarketAsset;
  setBuyBalance: (value: string) => void;
  setSellBalance: (value: string) => void;
}

export const UserBalanceObserver = ({ fromAsset, setBuyBalance, setSellBalance }: Props) => {
  const { account: activeAccount } = useActiveAccount();

  useEffect(() => {
    if (!activeAccount) {
      setSellBalance("0");
      setBuyBalance("0");
      return;
    }

    switch (fromAsset) {
      case MarketAsset.HBD:
      case MarketAsset.HIVE:
        setSellBalance(activeAccount.balance);
        setBuyBalance(activeAccount.hbd_balance);
        break;
    }
  }, [activeAccount, fromAsset, setBuyBalance, setSellBalance]);

  return <></>;
};
