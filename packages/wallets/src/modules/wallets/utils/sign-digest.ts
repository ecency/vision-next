import { PrivateKey } from "@hiveio/dhive";

/**
 * Sign a digest using the provided private key.
 * @param digest Digest as a Buffer or hex string.
 * @param privateKey Private key in WIF format.
 * @returns Hex encoded signature string.
 */
export function signDigest(digest: Buffer | string, privateKey: string): string {
  const key = PrivateKey.fromString(privateKey);
  const buf = typeof digest === "string" ? Buffer.from(digest, "hex") : digest;
  return key.sign(buf).toString();
}

