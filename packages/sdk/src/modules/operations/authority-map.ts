import type { Operation } from "@hiveio/dhive";

/**
 * Maps operation types to their required authority level.
 *
 * This mapping is used to determine which key (posting vs active) is needed
 * to sign a transaction, enabling smart auth fallback and auth upgrade UI.
 *
 * @remarks
 * - Most social operations (vote, comment, reblog) require posting authority
 * - Financial operations (transfer, withdraw) require active authority
 * - Account management operations require active authority
 * - custom_json requires dynamic detection based on required_auths vs required_posting_auths
 */
export const OPERATION_AUTHORITY_MAP: Record<string, 'posting' | 'active'> = {
  // Posting authority operations
  vote: 'posting',
  comment: 'posting',
  delete_comment: 'posting',
  comment_options: 'posting',
  claim_reward_balance: 'posting',

  // Active authority operations - Financial
  transfer: 'active',
  transfer_to_savings: 'active',
  transfer_from_savings: 'active',
  transfer_to_vesting: 'active',
  withdraw_vesting: 'active',
  delegate_vesting_shares: 'active',
  set_withdraw_vesting_route: 'active',
  convert: 'active',
  recurrent_transfer: 'active',

  // Active authority operations - Market
  limit_order_create: 'active',
  limit_order_cancel: 'active',

  // Active authority operations - Account Management
  account_update: 'active',
  account_update2: 'active',
  change_recovery_account: 'active',

  // Active authority operations - Governance
  account_witness_proxy: 'active',
  update_proposal_votes: 'active',

  // Note: custom_json is handled separately via getCustomJsonAuthority()
  // It can be either posting or active depending on the operation content
};

/**
 * Determines authority required for a custom_json operation.
 *
 * Custom JSON operations can require either posting or active authority
 * depending on which field is populated:
 * - required_auths (active authority)
 * - required_posting_auths (posting authority)
 *
 * @param customJsonOp - The custom_json operation to inspect
 * @returns 'active' if requires active authority, 'posting' if requires posting authority
 *
 * @example
 * ```typescript
 * // Reblog operation (posting authority)
 * const reblogOp: Operation = ['custom_json', {
 *   required_auths: [],
 *   required_posting_auths: ['alice'],
 *   id: 'reblog',
 *   json: '...'
 * }];
 * getCustomJsonAuthority(reblogOp); // Returns 'posting'
 *
 * // Some active authority custom_json
 * const activeOp: Operation = ['custom_json', {
 *   required_auths: ['alice'],
 *   required_posting_auths: [],
 *   id: 'some_active_op',
 *   json: '...'
 * }];
 * getCustomJsonAuthority(activeOp); // Returns 'active'
 * ```
 */
export function getCustomJsonAuthority(customJsonOp: Operation): 'posting' | 'active' {
  const opType = customJsonOp[0];
  const payload = customJsonOp[1];

  if (opType !== 'custom_json') {
    throw new Error('Operation is not a custom_json operation');
  }

  // Type assertion for custom_json payload
  const customJson = payload as {
    required_auths?: string[];
    required_posting_auths?: string[];
    id: string;
    json: string;
  };

  // If required_auths is set and non-empty, needs active authority
  if (customJson.required_auths && customJson.required_auths.length > 0) {
    return 'active';
  }

  // If only required_posting_auths is set, needs posting authority
  if (customJson.required_posting_auths && customJson.required_posting_auths.length > 0) {
    return 'posting';
  }

  // Default to posting for custom_json (most common case)
  return 'posting';
}

/**
 * Determines the required authority level for any operation.
 *
 * Uses the OPERATION_AUTHORITY_MAP for standard operations, and dynamic
 * detection for custom_json operations.
 *
 * @param op - The operation to check
 * @returns 'posting' or 'active' authority requirement
 *
 * @example
 * ```typescript
 * const voteOp: Operation = ['vote', { voter: 'alice', author: 'bob', permlink: 'post', weight: 10000 }];
 * getOperationAuthority(voteOp); // Returns 'posting'
 *
 * const transferOp: Operation = ['transfer', { from: 'alice', to: 'bob', amount: '1.000 HIVE', memo: '' }];
 * getOperationAuthority(transferOp); // Returns 'active'
 * ```
 */
export function getOperationAuthority(op: Operation): 'posting' | 'active' {
  const opType = op[0];

  // Special handling for custom_json - requires content inspection
  if (opType === 'custom_json') {
    return getCustomJsonAuthority(op);
  }

  // Use mapping for standard operations, default to posting if unknown
  return OPERATION_AUTHORITY_MAP[opType] ?? 'posting';
}

/**
 * Determines the highest authority level required for a list of operations.
 *
 * Useful when broadcasting multiple operations together - if any require
 * active authority, the entire batch needs active authority.
 *
 * @param ops - Array of operations
 * @returns 'active' if any operation requires active, 'posting' otherwise
 *
 * @example
 * ```typescript
 * const ops: Operation[] = [
 *   ['vote', { ... }],        // posting
 *   ['comment', { ... }],     // posting
 * ];
 * getRequiredAuthority(ops); // Returns 'posting'
 *
 * const mixedOps: Operation[] = [
 *   ['comment', { ... }],     // posting
 *   ['transfer', { ... }],    // active
 * ];
 * getRequiredAuthority(mixedOps); // Returns 'active'
 * ```
 */
export function getRequiredAuthority(ops: Operation[]): 'posting' | 'active' {
  // If any operation requires active authority, return 'active'
  for (const op of ops) {
    if (getOperationAuthority(op) === 'active') {
      return 'active';
    }
  }

  // All operations can be done with posting authority
  return 'posting';
}
