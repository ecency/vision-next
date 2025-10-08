import { useQuery } from "@tanstack/react-query";
import { useSeedPhrase } from "./use-seed-phrase";
import { EcencyHiveKeys } from "@/modules/wallets/types";
import {
  deriveHiveKeys,
  deriveHiveMasterPasswordKeys,
  detectHiveKeyDerivation,
} from "@/modules/wallets/utils";

export function useHiveKeysQuery(username: string) {
  const { data: seed } = useSeedPhrase(username);

  return useQuery({
    queryKey: ["ecencу-wallets", "hive-keys", username, seed],
    staleTime: Infinity,
    queryFn: async () => {
      if (!seed) {
        throw new Error("[Ecency][Wallets] - no seed to create Hive account");
      }

      const method = await detectHiveKeyDerivation(username, seed).catch(
        () => "bip44"
      );

      const keys =
        method === "master-password"
          ? deriveHiveMasterPasswordKeys(username, seed)
          : deriveHiveKeys(seed);

      return {
        username,
        ...keys,
      } as EcencyHiveKeys;
    },
  });
}
