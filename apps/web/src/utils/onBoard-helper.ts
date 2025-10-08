import { deriveHiveKeys } from "@/features/wallet/sdk";
import { generateMnemonic } from "bip39";

export const getKeysFromSeed = (seed: string) => {
  return deriveHiveKeys(seed);
};

export const generateSeed = async () => {
  return generateMnemonic(128);
};

