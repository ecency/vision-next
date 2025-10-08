import { EcencyWalletCurrency } from "@/modules/wallets/enums";
import { getKeysFromSeed } from "@/modules/wallets/functions";
import { EcencyTokenMetadata } from "@/modules/wallets/types";
import { getWallet } from "@/modules/wallets/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EcencyWalletsPrivateApi } from "./private-api-namespace";

interface Payload {
  privateKeyOrSeed: string;
}

/**
 * This mutation uses for importing an existing wallet, validation and saving logically in application
 *
 * Keep attention: this mutation doesn't save wallet to somewhere in a server
 */
export function useImportWallet(
  username: string,
  currency: EcencyWalletCurrency
) {
  const queryClient = useQueryClient();
  const { mutateAsync: checkWalletExistence } =
    EcencyWalletsPrivateApi.useCheckWalletExistence();

  return useMutation({
    mutationKey: ["ecency-wallets", "import-wallet", username, currency],
    mutationFn: async ({ privateKeyOrSeed }: Payload) => {
      const wallet = getWallet(currency);

      if (!wallet) {
        throw new Error("Cannot find token for this currency");
      }

      const isSeed = privateKeyOrSeed.split(" ").length === 12;
      let address;
      let privateKey = privateKeyOrSeed;

      if (isSeed) {
        [privateKey, address] = await getKeysFromSeed(
          privateKeyOrSeed,
          wallet,
          currency
        );
      } else {
        address = (
          await wallet.getNewAddress({
            privateKey: privateKeyOrSeed,
          })
        ).address;
      }

      if (!address || !privateKeyOrSeed) {
        throw new Error(
          "Private key/seed phrase isn't matching with public key or token"
        );
      }

      // Check wallet for existence in an Ecency's private API
      const hasChecked = await checkWalletExistence({
        address,
        currency,
      });
      if (!hasChecked) {
        throw new Error(
          "This wallet has already in use by Hive account. Please, try another one"
        );
      }

      return {
        privateKey,
        address,
        publicKey: "",
      };
    },
    onSuccess: ({ privateKey, publicKey, address }) => {
      queryClient.setQueryData<Map<EcencyWalletCurrency, EcencyTokenMetadata>>(
        ["ecency-wallets", "wallets", username],
        (data) =>
          new Map(data ? Array.from(data.entries()) : []).set(currency, {
            privateKey,
            publicKey,
            address,
            username,
            currency,
            type: "CHAIN",
            custom: true,
          })
      );
    },
  });
}
