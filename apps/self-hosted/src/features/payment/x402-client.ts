/**
 * x402 Payment Protocol - Browser Client
 *
 * Browser-compatible utilities for the x402 payment protocol.
 * No Node.js dependencies — uses Web Crypto and direct RPC calls.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PaymentRequirements {
  x402Version: number;
  scheme: 'exact';
  network: string;
  maxAmountRequired: string;
  resource: string;
  description?: string;
  mimeType?: string;
  payTo: string;
  validBefore: string;
  extra?: Record<string, unknown>;
}

export interface PaymentRequired {
  x402Version: number;
  accepts: PaymentRequirements[];
}

export interface UnsignedPaymentTx {
  transaction: HiveTransaction;
  nonce: string;
}

export interface HiveTransaction {
  ref_block_num: number;
  ref_block_prefix: number;
  expiration: string;
  operations: [string, Record<string, unknown>][];
  extensions: unknown[];
}

// ─── Parse Requirements ─────────────────────────────────────────────────────

/**
 * Extract payment requirements from a 402 response.
 * Checks both the x-payment header and the JSON body.
 */
export async function parseRequirementsFromResponse(
  response: Response
): Promise<PaymentRequirements | null> {
  const header = response.headers.get('x-payment');

  if (header) {
    try {
      const pr: PaymentRequired = JSON.parse(atob(header));
      const hiveReq = pr.accepts?.find((a) => a.network === 'hive:mainnet');
      if (hiveReq) return hiveReq;
    } catch {
      // Fall through to body parsing
    }
  }

  try {
    const body: PaymentRequired = await response.json();
    const hiveReq = body.accepts?.find((a) => a.network === 'hive:mainnet');
    if (hiveReq) return hiveReq;
  } catch {
    // No parseable requirements
  }

  return null;
}

// ─── Build Payment Transaction ──────────────────────────────────────────────

const HIVE_API_NODES = [
  'https://api.hive.blog',
  'https://api.deathwing.me',
  'https://techcoderx.com',
  'https://rpc.ausbit.dev',
  'https://hive-api.arcange.eu',
];

/**
 * Build an unsigned Hive HBD transfer transaction for x402 payment.
 * Uses Web Crypto + direct JSON-RPC — no dhive dependency.
 */
export async function buildPaymentTx(
  account: string,
  requirements: PaymentRequirements
): Promise<UnsignedPaymentTx> {
  // Generate random nonce (browser-compatible)
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Get current block reference from Hive
  const props = await fetchDynamicGlobalProperties();
  const refBlockNum = props.head_block_number & 0xffff;

  // Parse block prefix using DataView
  const blockIdBytes = hexToBytes(props.head_block_id);
  const view = new DataView(
    blockIdBytes.buffer,
    blockIdBytes.byteOffset,
    blockIdBytes.byteLength
  );
  const refBlockPrefix = view.getUint32(4, true);

  // Expiration: min(60s from now, validBefore) — fail fast if already expired
  const now = Date.now();
  let expiryMs = now + 60 * 1000;
  if (requirements.validBefore) {
    const validBeforeMs = new Date(requirements.validBefore).getTime();
    if (Number.isNaN(validBeforeMs)) {
      throw new Error('Invalid validBefore timestamp in payment requirements');
    }
    if (validBeforeMs <= now) {
      throw new Error('Payment requirements have expired (validBefore is in the past)');
    }
    if (validBeforeMs < expiryMs) {
      expiryMs = validBeforeMs;
    }
  }
  const expiration = new Date(expiryMs).toISOString().slice(0, -5);

  const transaction: HiveTransaction = {
    ref_block_num: refBlockNum,
    ref_block_prefix: refBlockPrefix,
    expiration,
    operations: [
      [
        'transfer',
        {
          from: account,
          to: requirements.payTo,
          amount: requirements.maxAmountRequired,
          memo: `x402:${nonce}`,
        },
      ],
    ],
    extensions: [],
  };

  return { transaction, nonce };
}

// ─── Encode Payment Header ──────────────────────────────────────────────────

/**
 * Encode a signed transaction + nonce into the base64 x-payment header value.
 */
export function encodePaymentHeader(
  signedTx: Record<string, unknown>,
  nonce: string
): string {
  const payload = {
    x402Version: 1,
    scheme: 'exact',
    network: 'hive:mainnet',
    payload: {
      signedTransaction: signedTx,
      nonce,
    },
  };

  return btoa(JSON.stringify(payload));
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

interface DynamicGlobalProperties {
  head_block_number: number;
  head_block_id: string;
}

const NODE_TIMEOUT_MS = 8000;

async function fetchDynamicGlobalProperties(): Promise<DynamicGlobalProperties> {
  let lastError: Error | undefined;
  for (const node of HIVE_API_NODES) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NODE_TIMEOUT_MS);
    try {
      const res = await fetch(node, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'condenser_api.get_dynamic_global_properties',
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const json = (await res.json()) as { result?: DynamicGlobalProperties };
      const r = json.result;
      if (
        r &&
        typeof r.head_block_id === 'string' &&
        r.head_block_id.length > 0 &&
        typeof r.head_block_number === 'number' &&
        Number.isInteger(r.head_block_number)
      ) {
        return r;
      }
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error('All Hive API nodes failed');
}
