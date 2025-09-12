import { deriveHiveKeys } from "@ecency/wallets";
import { generateMnemonic } from "bip39";

export const getKeysFromSeed = (seed: string) => {
  return deriveHiveKeys(seed);
};

export const generateSeed = async () => {
  return generateMnemonic(128);
};

