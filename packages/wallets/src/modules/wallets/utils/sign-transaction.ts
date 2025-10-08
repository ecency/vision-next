import { PrivateKey, Client } from "@hiveio/dhive";
import type {
  Transaction,
  SignedTransaction,
  TransactionConfirmation,
} from "@hiveio/dhive/lib/chain/transaction";
import { cryptoUtils } from "@hiveio/dhive/lib/crypto";

/**
 * Sign a transaction with the given private key.
 * Optionally a custom chain id can be provided.
 *
 * @param tx Transaction to sign.
 * @param privateKey Private key in WIF format.
 * @param chainId Optional chain id as a hex string.
 * @returns Signed transaction including the signature.
 */
export function signTx(
  tx: Transaction,
  privateKey: string,
  chainId?: string
): SignedTransaction {
  const key = PrivateKey.fromString(privateKey);
  const chain = chainId ? Buffer.from(chainId, "hex") : undefined;
  return cryptoUtils.signTransaction(tx, key, chain);
}

/**
 * Sign a transaction and broadcast it to the network.
 * Optionally a custom chain id can be provided.
 *
 * @param client Hive client instance used for broadcasting.
 * @param tx Transaction to sign.
 * @param privateKey Private key in WIF format.
 * @param chainId Optional chain id as a hex string.
 * @returns Broadcast confirmation.
 */
export async function signTxAndBroadcast(
  client: Client,
  tx: Transaction,
  privateKey: string,
  chainId?: string
): Promise<TransactionConfirmation> {
  const signed = signTx(tx, privateKey, chainId);
  return client.broadcast.send(signed);
}

