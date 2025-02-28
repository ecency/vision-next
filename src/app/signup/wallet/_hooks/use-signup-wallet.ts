import { useCallback } from "react";
import { BtcWallet } from "@okxweb3/coin-bitcoin";
import { EthWallet } from "@okxweb3/coin-ethereum";
import { TrxWallet } from "@okxweb3/coin-tron";
import { TonWallet } from "@okxweb3/coin-ton";
import { SolWallet } from "@okxweb3/coin-solana";
import { AtomWallet } from "@okxweb3/coin-cosmos";
import { AptosWallet } from "@okxweb3/coin-aptos";
import { BaseWallet } from "@okxweb3/coin-base";
import { useMutation } from "@tanstack/react-query";
import { delay } from "@/utils";
import { ExternalWalletCurrency } from "@/enums";
import { SignupExternalWalletInformation } from "../types";

function getWallet(currency: ExternalWalletCurrency): BaseWallet | undefined {
  switch (currency) {
    case ExternalWalletCurrency.BTC:
      return new BtcWallet();

    case ExternalWalletCurrency.ETH:
      return new EthWallet();

    case ExternalWalletCurrency.TRON:
      return new TrxWallet();

    case ExternalWalletCurrency.TON:
      return new TonWallet();

    case ExternalWalletCurrency.SOL:
      return new SolWallet();

    case ExternalWalletCurrency.ATOM:
      return new AtomWallet();

    case ExternalWalletCurrency.APT:
      return new AptosWallet();

    default:
      return undefined;
  }
}

export function useSignpupWallet(currency: ExternalWalletCurrency) {
  const createWallet = useMutation({
    mutationKey: ["create-wallet", currency],
    mutationFn: async () => {
      const wallet = getWallet(currency);
      const privateKey = (await wallet?.getRandomPrivateKey()) as string;
      await delay(1000);
      const address = (await wallet?.getNewAddress({
        privateKey
      })) as { address: string; publicKey: string };
      return {
        privateKey,
        address: address.address,
        publicKey: address.publicKey
      } as SignupExternalWalletInformation;
    }
  });
  const importWallet = useCallback((currency: ExternalWalletCurrency) => {}, []);

  return {
    createWallet,
    importWallet
  };
}
