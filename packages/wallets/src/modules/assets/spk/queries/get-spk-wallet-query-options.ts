import { getSpkWallet } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { SpkApiWallet } from "../../types";

export function getSpkWalletQueryOptions(username?: string) {
  return queryOptions({
    queryKey: ["assets", "spk", "wallet", username],
    queryFn: async () => {
      return getSpkWallet<SpkApiWallet>(username as string);
    },
    enabled: !!username,
    staleTime: 60000,
    refetchInterval: 90000,
  });
}
