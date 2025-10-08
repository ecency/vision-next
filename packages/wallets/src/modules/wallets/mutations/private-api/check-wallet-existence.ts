import { CONFIG } from "@ecency/sdk";
import { EcencyWalletCurrency } from "@/modules/wallets/enums";
import { useMutation } from "@tanstack/react-query";

interface Payload {
  address: string;
  currency: EcencyWalletCurrency;
}

export function useCheckWalletExistence() {
  return useMutation({
    mutationKey: ["ecency-wallets", "check-wallet-existence"],
    mutationFn: async ({ address, currency }: Payload) => {
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/wallets-exist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            address,
            token: currency,
          }),
        }
      );
      const data = await response.json();
      return data.length === 0;
    },
  });
}
