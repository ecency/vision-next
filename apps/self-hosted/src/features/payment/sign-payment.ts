/**
 * x402 Payment Signing Orchestrator
 *
 * Dispatches transaction signing to the appropriate method:
 * - Keychain (browser extension)
 * - HiveAuth (mobile app via WebSocket)
 * - Manual (active key input)
 */

import type { HiveAuthSession } from '../auth/types';
import { signTx } from '../auth/utils/keychain';
import { signWithHiveAuth } from '../auth/utils/hive-auth';
import {
  buildPaymentTx,
  encodePaymentHeader,
  type PaymentRequirements,
} from './x402-client';

export type PaymentSignMethod = 'keychain' | 'hiveauth' | 'manual';

export interface SignX402PaymentOptions {
  /** HiveAuth session (required when method is 'hiveauth') */
  hiveAuthSession?: HiveAuthSession;
  /** Active private key in WIF format (required when method is 'manual') */
  activeKey?: string;
}

/**
 * Build, sign, and encode a payment for the x-payment header.
 *
 * Returns the base64-encoded header value ready to send.
 */
export async function signX402Payment(
  username: string,
  requirements: PaymentRequirements,
  method: PaymentSignMethod,
  options?: SignX402PaymentOptions
): Promise<string> {
  // Step 1: Build unsigned transaction
  const { transaction, nonce } = await buildPaymentTx(username, requirements);

  // Step 2: Sign based on method
  let signedTx: Record<string, unknown>;

  switch (method) {
    case 'keychain': {
      const resp = await signTx(username, transaction as any, 'Active');
      if (!resp.result) {
        throw new Error('Keychain did not return signed transaction');
      }
      try {
        signedTx = JSON.parse(resp.result);
      } catch (e) {
        throw new Error(`Failed to parse Keychain signed transaction: ${e instanceof Error ? e.message : e}`);
      }
      break;
    }

    case 'hiveauth': {
      if (!options?.hiveAuthSession) {
        throw new Error('HiveAuth session required for HiveAuth signing');
      }
      const data = await signWithHiveAuth(
        options.hiveAuthSession,
        transaction.operations as any
      );
      if (!data) {
        throw new Error('HiveAuth did not return signed transaction');
      }
      try {
        signedTx = JSON.parse(data);
      } catch (e) {
        throw new Error(`Failed to parse HiveAuth signed transaction: ${e instanceof Error ? e.message : e}`);
      }
      break;
    }

    case 'manual': {
      if (!options?.activeKey) {
        throw new Error('Active key required for manual signing');
      }
      // Dynamic import dhive only when needed (keeps bundle small for other methods)
      const { PrivateKey, cryptoUtils } = await import('@hiveio/dhive');
      const chainId = Buffer.from(
        'beeab0de00000000000000000000000000000000000000000000000000000000',
        'hex'
      );
      const privKey = PrivateKey.fromString(options.activeKey);
      const signed = cryptoUtils.signTransaction(
        transaction as any,
        privKey,
        chainId
      );
      signedTx = signed as unknown as Record<string, unknown>;
      break;
    }

    default:
      throw new Error(`Unsupported signing method: ${method}`);
  }

  // Step 3: Encode for x-payment header
  return encodePaymentHeader(signedTx, nonce);
}
