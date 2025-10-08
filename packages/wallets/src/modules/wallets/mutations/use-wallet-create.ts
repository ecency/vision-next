import { EcencyWalletCurrency } from "@/modules/wallets/enums";
import { useSeedPhrase } from "@/modules/wallets/queries";
import { EcencyTokenMetadata } from "@/modules/wallets/types";
import { delay, getWallet } from "@/modules/wallets/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const PATHS = {
  [EcencyWalletCurrency.BTC]: "m/44'/0'/0'/0/0", // Bitcoin (BIP44)
  [EcencyWalletCurrency.ETH]: "m/44'/60'/0'/0/0", // Ethereum (BIP44)
  [EcencyWalletCurrency.BNB]: "m/44'/60'/0'/0/0", // BNB Smart Chain (BIP44)
  [EcencyWalletCurrency.SOL]: "m/44'/501'/0'/0'", // Solana (BIP44)
  [EcencyWalletCurrency.TON]: "m/44'/607'/0'", // TON (BIP44)
  [EcencyWalletCurrency.TRON]: "m/44'/195'/0'/0/0", // Tron (BIP44)
  [EcencyWalletCurrency.APT]: "m/44'/637'/0'/0'/0'", // Aptos (BIP44)
} as const;

/**
 * Uses for creating wallet logically in the application
 *
 * Keep attention: this mutation doesn't save wallet to somewhere in a server
 */
export function useWalletCreate(
  username: string,
  currency: EcencyWalletCurrency
) {
  const { data: mnemonic } = useSeedPhrase(username);
  const queryClient = useQueryClient();

  const createWallet = useMutation({
    mutationKey: ["ecency-wallets", "create-wallet", username, currency],
    mutationFn: async () => {
      if (!mnemonic) {
        throw new Error("[Ecency][Wallets] - No seed to create a wallet");
      }

      const wallet = getWallet(currency);
      const privateKey = await wallet?.getDerivedPrivateKey({
        mnemonic,
        hdPath: PATHS[currency],
      });
      await delay(1000);
      const address = (await wallet?.getNewAddress({
        privateKey,
      })) as { address: string; publicKey: string };
      return {
        privateKey,
        address: address.address,
        publicKey: address.publicKey,
        username,
        currency,
      } as EcencyTokenMetadata;
    },
    onSuccess: (info) => {
      queryClient.setQueryData<Map<EcencyWalletCurrency, EcencyTokenMetadata>>(
        ["ecency-wallets", "wallets", info.username],
        (data) =>
          new Map(data ? Array.from(data.entries()) : []).set(
            info.currency as EcencyWalletCurrency,
            info
          )
      );
    },
  });
  const importWallet = useCallback(() => {}, []);

  return {
    createWallet,
    importWallet,
  };
}
