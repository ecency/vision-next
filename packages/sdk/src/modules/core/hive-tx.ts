/**
 * Compatibility layer for migrating from @hiveio/dhive to @ecency/hive-tx.
 *
 * Re-exports hive-tx APIs and provides helper functions that bridge the
 * API differences between dhive and hive-tx.
 */

import {
  PrivateKey,
  Transaction,
  callRPCBroadcast,
  config as hiveTxConfig,
} from "@ecency/hive-tx";
import type { Operation, OperationName, OperationBody } from "@ecency/hive-tx";
import { sha256 as nobleSha256 } from "@noble/hashes/sha2.js";

// ── Re-exports ─────────────────────────────────────────────────────────────

export {
  PrivateKey,
  PublicKey,
  Signature,
  Memo,
  config as hiveTxConfig,
  callRPC,
  callRPCBroadcast,
  callREST,
  callWithQuorum,
  utils as hiveTxUtils,
} from "@ecency/hive-tx";

export type {
  Operation,
  OperationName,
  AssetSymbol,
  BroadcastResult,
  AccountCreateOperation,
  CustomJsonOperation,
} from "@ecency/hive-tx";

// ── Compat types (matching dhive shapes used throughout the codebase) ──────

/** Compatible with dhive's TransactionConfirmation from broadcast_transaction_synchronous */
export interface TransactionConfirmation {
  id: string;
  block_num: number;
  trx_num: number;
  expired: boolean;
}

/** Authority role type used in key management */
export type AuthorityType = "owner" | "active" | "posting" | "memo";

/** SMT asset format (NAI representation) used in transaction history */
export interface SMTAsset {
  amount: string;
  precision: number;
  nai: string;
}

/** RC account data from rc_api.find_rc_accounts */
export interface RCAccount {
  account: string;
  rc_manabar: {
    current_mana: string | number;
    last_update_time: number;
  };
  max_rc: string | number;
  max_rc_creation_adjustment: {
    amount: string;
    precision: number;
    nai: string;
  };
  delegated_rc: number;
  received_delegated_rc: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute SHA-256 hash of a string or Uint8Array.
 * Drop-in replacement for dhive's `cryptoUtils.sha256()`.
 */
export function sha256(input: string | Uint8Array): Uint8Array {
  const data = typeof input === "string"
    ? new TextEncoder().encode(input)
    : input;
  return nobleSha256(data);
}

/** Check if a string is a valid WIF-encoded private key. */
export function isWif(key: string): boolean {
  try {
    PrivateKey.fromString(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sign and broadcast operations, returning a dhive-compatible TransactionConfirmation.
 *
 * Uses broadcast_transaction_synchronous so the response includes block_num/trx_num,
 * matching the shape that the rest of the codebase expects from dhive's
 * `client.broadcast.sendOperations()`.
 */
export async function broadcastOperations(
  ops: Operation[],
  key: PrivateKey
): Promise<TransactionConfirmation> {
  const tx = new Transaction();
  for (const op of ops) {
    await tx.addOperation(
      op[0] as OperationName,
      op[1] as OperationBody<OperationName>
    );
  }
  tx.sign(key);
  return callRPCBroadcast("condenser_api.broadcast_transaction_synchronous", [
    tx.transaction,
  ]);
}

// ── Mana calculations (ported from dhive's RCAPI) ──────────────────────────

interface Manabar {
  current_mana: string | number;
  last_update_time: number;
}

interface ManaResult {
  current_mana: number;
  max_mana: number;
  percentage: number;
}

const MANA_REGENERATION_SECONDS = 432000; // 5 days

function calculateManabar(maxMana: number, manabar: Manabar): ManaResult {
  const delta = Date.now() / 1000 - manabar.last_update_time;
  let currentMana =
    Number(manabar.current_mana) +
    (delta * maxMana) / MANA_REGENERATION_SECONDS;
  let percentage = Math.round((currentMana / maxMana) * 10000);
  if (!isFinite(percentage) || percentage < 0) {
    percentage = 0;
  } else if (percentage > 10000) {
    percentage = 10000;
  }
  return { current_mana: currentMana, max_mana: maxMana, percentage };
}

/**
 * Get effective vesting shares for an account (matching dhive's getVests).
 * Subtracts delegated, adds received, accounts for pending withdrawals.
 */
function getVests(account: any): number {
  const vests = parseFloat(account.vesting_shares);
  const delegated = parseFloat(account.delegated_vesting_shares);
  const received = parseFloat(account.received_vesting_shares);
  const withdrawRate = parseFloat(account.vesting_withdraw_rate);
  const alreadyWithdrawn =
    (Number(account.to_withdraw) - Number(account.withdrawn)) / 1e6;
  const withdrawVests = Math.min(withdrawRate, alreadyWithdrawn);
  return vests - withdrawVests - delegated + received;
}

/** Calculate voting power mana (equivalent to dhive client.rc.calculateVPMana) */
export function calculateVPMana(account: any): ManaResult {
  const maxMana = getVests(account) * 1e6;
  return calculateManabar(maxMana, account.voting_manabar);
}

/** Calculate RC mana (equivalent to dhive client.rc.calculateRCMana) */
export function calculateRCMana(rcAccount: RCAccount): ManaResult {
  return calculateManabar(
    Number(rcAccount.max_rc),
    rcAccount.rc_manabar
  );
}

// ── Node configuration ─────────────────────────────────────────────────────

/**
 * Configure hive-tx nodes. Call this from ConfigManager.setHiveNodes().
 * Replaces dhive's `new Client(nodes, options)`.
 */
export function setHiveTxNodes(nodes: string[], timeout = 20000) {
  hiveTxConfig.nodes = nodes;
  hiveTxConfig.timeout = timeout;
}

/**
 * Initialize hive-tx with default node configuration.
 * Called once during SDK init.
 */
export function initHiveTx(nodes: string[], timeout = 20000) {
  hiveTxConfig.nodes = nodes;
  hiveTxConfig.timeout = timeout;
}
