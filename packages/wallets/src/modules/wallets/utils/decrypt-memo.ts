import { PrivateKey } from "@hiveio/dhive";
import { Memo } from "@hiveio/dhive/lib/memo";

/**
 * Decrypt an encrypted memo using the recipient's private key.
 * @param privateKey Private memo key in WIF format.
 * @param memo Encrypted memo string.
 */
export function decryptMemoWithKeys(privateKey: string, memo: string): string {
  return Memo.decode(PrivateKey.fromString(privateKey), memo);
}

/**
 * Decrypt a memo using account information.
 * This is an alias of {@link decryptMemoWithKeys} and provided for
 * API symmetry with {@link encryptMemoWithAccounts}.
 */
export const decryptMemoWithAccounts = decryptMemoWithKeys;

