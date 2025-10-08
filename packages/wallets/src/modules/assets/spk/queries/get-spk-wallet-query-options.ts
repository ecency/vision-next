import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { SpkApiWallet } from "../../types";

export function getSpkWalletQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "spk", "wallet", username],
    queryFn: async () => {
      const response = await fetch(CONFIG.spkNode + `/@${username}`);
      return response.json() as Promise<SpkApiWallet>;
    },
    enabled: !!username,
    staleTime: 60000,
    refetchInterval: 90000,
  });
}
