import { useQuery } from "@tanstack/react-query";
import bip39 from "bip39";

export function useSeedPhrase(username: string) {
  return useQuery({
    queryKey: ["ecency-wallets", "seed", username],
    queryFn: async () => bip39.generateMnemonic(128),
    // CRITICAL: Prevent seed regeneration - cache forever
    // Once generated, the seed must NEVER change to ensure consistency between:
    // 1. Displayed seed phrase
    // 2. Downloaded seed file
    // 3. Keys sent to API for account creation
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
