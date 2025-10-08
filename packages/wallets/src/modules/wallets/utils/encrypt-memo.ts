import { PrivateKey } from "@hiveio/dhive";
import type { Client } from "@hiveio/dhive";
import { Memo } from "@hiveio/dhive/lib/memo";

/**
 * Encrypt a memo using explicit keys.
 * @param privateKey Sender's private memo key in WIF format.
 * @param publicKey Recipient's public memo key.
 * @param memo Memo text to encrypt.
 */
export function encryptMemoWithKeys(
  privateKey: string,
  publicKey: string,
  memo: string
): string {
  return Memo.encode(PrivateKey.fromString(privateKey), publicKey, memo);
}

/**
 * Encrypt a memo by looking up the recipient's memo key from the blockchain.
 * @param client Hive client instance used to fetch account information.
 * @param fromPrivateKey Sender's private memo key.
 * @param toAccount Recipient account name.
 * @param memo Memo text to encrypt.
 */
export async function encryptMemoWithAccounts(
  client: Client,
  fromPrivateKey: string,
  toAccount: string,
  memo: string
): Promise<string> {
  const [account] = await client.database.getAccounts([toAccount]);
  if (!account) {
    throw new Error("Account not found");
  }
  return Memo.encode(PrivateKey.fromString(fromPrivateKey), account.memo_key, memo);
}

