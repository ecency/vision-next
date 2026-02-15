import { CONFIG } from '@ecency/sdk';
import { cryptoUtils, PrivateKey, type Operation } from '@hiveio/dhive';
import type { TippingAsset } from '../types';

const KEY_TYPE = 'active' as const;

function formatKeyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  return /base58|invalid|wif/i.test(msg)
    ? 'Invalid key format'
    : 'Invalid private key or password';
}

/**
 * Resolve raw key input to a PrivateKey. Same flow as apps/web KeyInput:
 * - WIF (cryptoUtils.isWif) -> PrivateKey.fromString
 * - With username: try master password (PrivateKey.fromLogin), then WIF
 * - Without username: WIF only
 * BIP44 seed support would require @ecency/wallets (detectHiveKeyDerivation, deriveHiveKeys).
 */
export async function resolvePrivateKey(
  keyStr: string,
  username?: string
): Promise<PrivateKey> {
  const key = keyStr.trim();
  if (!key) {
    throw new Error('Key is required');
  }

  try {
    if (cryptoUtils.isWif(key)) {
      return PrivateKey.fromString(key);
    }

    if (username) {
      try {
        return PrivateKey.fromLogin(username, key, KEY_TYPE);
      } catch {
        return PrivateKey.fromString(key);
      }
    }

    return PrivateKey.fromString(key);
  } catch (err) {
    throw new Error(formatKeyError(err));
  }
}

export interface ExecuteTipParams {
  from: string;
  to: string;
  amount: string;
  asset: TippingAsset;
  key: PrivateKey;
  memo: string;
}

/**
 * Resolve account name (from) from a private key using get_key_references.
 */
export async function resolveFromAccountFromKey(key: PrivateKey): Promise<string> {
  const publicKey = key.createPublic().toString();
  const result = (await CONFIG.hiveClient.database.call('get_key_references', [
    [publicKey],
  ])) as string[][];
  const accounts = result?.[0];
  if (!accounts?.length) {
    throw new Error('No account found for this key');
  }
  return accounts[0];
}

/**
 * Execute tip: transfer HIVE, HBD, or POINTS using CONFIG.hiveClient (no @ecency/wallets).
 */
export async function executeTip(params: ExecuteTipParams): Promise<void> {
  const { from, to, amount, asset, key, memo } = params;
  const num = parseFloat(amount);
  if (!Number.isFinite(num) || num <= 0) {
    throw new Error('Invalid amount');
  }
  const formatted = num.toFixed(3);
  if (asset === 'HIVE') {
    await CONFIG.hiveClient.broadcast.transfer(
      {
        from,
        to,
        amount: `${formatted} HIVE`,
        memo,
      },
      key
    );
  } else if (asset === 'HBD') {
    await CONFIG.hiveClient.broadcast.transfer(
      {
        from,
        to,
        amount: `${formatted} HBD`,
        memo,
      },
      key
    );
  } else if (asset === 'POINTS') {
    const op: Operation = [
      'custom_json',
      {
        id: 'ecency_point_transfer',
        json: JSON.stringify({
          sender: from,
          receiver: to,
          amount: `${formatted} POINT`,
          memo,
        }),
        required_auths: [from],
        required_posting_auths: [],
      },
    ];
    await CONFIG.hiveClient.broadcast.sendOperations([op], key);
  } else {
    throw new Error(`Unsupported asset: ${asset}`);
  }
}
