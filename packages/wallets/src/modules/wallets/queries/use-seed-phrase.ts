import { useQuery } from "@tanstack/react-query";
import bip39 from "bip39";

export function useSeedPhrase(username: string) {
  return useQuery({
    queryKey: ["ecency-wallets", "seed", username],
    queryFn: async () => bip39.generateMnemonic(128),
  });
}
