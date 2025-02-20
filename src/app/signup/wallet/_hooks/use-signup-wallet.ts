import { useCallback } from "react";
import { BtcWallet } from "@okxweb3/coin-bitcoin";
import { EthWallet } from "@okxweb3/coin-ethereum";
import { TrxWallet } from "@okxweb3/coin-tron";
import { TonWallet } from "@okxweb3/coin-ton";
import { SolWallet } from "@okxweb3/coin-solana";
import { AtomWallet } from "@okxweb3/coin-cosmos";
import { AptosWallet } from "@okxweb3/coin-aptos";
import { SignupWalletCurrency } from "../_enums";
import { BaseWallet } from "@okxweb3/coin-base";
import { useMutation } from "@tanstack/react-query";
import { delay } from "@/utils";

function getWallet(currency: SignupWalletCurrency): BaseWallet | undefined {
  switch (currency) {
    case SignupWalletCurrency.BTC:
      return new BtcWallet();

    case SignupWalletCurrency.ETH:
      return new EthWallet();

    case SignupWalletCurrency.TRON:
      return new TrxWallet();

    case SignupWalletCurrency.TON:
      return new TonWallet();

    case SignupWalletCurrency.SOL:
      return new SolWallet();

    case SignupWalletCurrency.ATOM:
      return new AtomWallet();

    case SignupWalletCurrency.APT:
      return new AptosWallet();

    default:
      return undefined;
  }
}

export function useSignpupWallet() {
  const createWallet = useMutation({
    mutationKey: ["create-wallet"],
    mutationFn: async (currency: SignupWalletCurrency) => {
      const wallet = getWallet(currency);
      const privateKey = await wallet?.getRandomPrivateKey();
      await delay(1000);
      const address = await wallet?.getNewAddress({
        privateKey
      });
      console.log(address);
      return [privateKey, address] as const;
    }
  });
  const importWallet = useCallback((currency: SignupWalletCurrency) => {}, []);

  return {
    createWallet,
    importWallet
  };
}
