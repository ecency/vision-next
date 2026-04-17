import { PrivateKey } from "@ecency/sdk";

/**
 * Generate a Hive master password (P5... format).
 * Uses crypto.getRandomValues for entropy, then creates a WIF-encoded key.
 */
export function generateMasterPassword(): string {
  const entropy = [
    crypto.randomUUID(),
    crypto.randomUUID(),
    Date.now().toString()
  ].join("-");
  const key = PrivateKey.fromSeed(entropy);
  return "P" + key.toString();
}
