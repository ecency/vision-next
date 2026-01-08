import { getSpkWallet } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { SpkApiWallet } from "../../types";

export function getSpkWalletQueryOptions(username?: string) {
  return queryOptions({
    queryKey: ["assets", "spk", "wallet", username],
    queryFn: async () => {
      if (!username) {
        throw new Error("[SDK][Wallets][SPK] – username wasn't provided");
      }
      return getSpkWallet<SpkApiWallet>(username);
    },
    enabled: !!username,
    staleTime: 60000,
    refetchInterval: 90000,
  });
}
