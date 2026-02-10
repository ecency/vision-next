import type { Operation } from "@hiveio/dhive";

/**
 * Authority levels for Hive blockchain operations.
 * - posting: Social operations (voting, commenting, reblogging)
 * - active: Financial and account management operations
 * - owner: Critical security operations (key changes, account recovery)
 * - memo: Memo encryption/decryption (rarely used for signing)
 */
export type AuthorityLevel = 'posting' | 'active' | 'owner' | 'memo';

/**
 * Maps operation types to their required authority level.
 *
 * This mapping is used to determine which key is needed to sign a transaction,
 * enabling smart auth fallback and auth upgrade UI.
 *
 * @remarks
 * - Most social operations (vote, comment, reblog) require posting authority
 * - Financial operations (transfer, withdraw) require active authority
 * - Account management operations require active authority
 * - Security operations (password change, account recovery) require owner authority
 * - custom_json requires dynamic detection based on required_auths vs required_posting_auths
 */
export const OPERATION_AUTHORITY_MAP: Record<string, AuthorityLevel> = {
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

  // Active authority operations - Governance
  account_witness_proxy: 'active',
  update_proposal_votes: 'active',

  // Owner authority operations - Security & Account Recovery
  change_recovery_account: 'owner',
  request_account_recovery: 'owner',
  recover_account: 'owner',
  reset_account: 'owner',
  set_reset_account: 'owner',

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
export function getCustomJsonAuthority(customJsonOp: Operation): AuthorityLevel {
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
export function getOperationAuthority(op: Operation): AuthorityLevel {
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
 * Useful when broadcasting multiple operations together - the highest authority
 * level required by any operation determines what key is needed for the batch.
 *
 * Authority hierarchy: owner > active > posting > memo
 *
 * @param ops - Array of operations
 * @returns Highest authority level required ('owner', 'active', or 'posting')
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
 *
 * const securityOps: Operation[] = [
 *   ['transfer', { ... }],               // active
 *   ['change_recovery_account', { ... }], // owner
 * ];
 * getRequiredAuthority(securityOps); // Returns 'owner'
 * ```
 */
export function getRequiredAuthority(ops: Operation[]): AuthorityLevel {
  let highestAuthority: AuthorityLevel = 'posting';

  for (const op of ops) {
    const authority = getOperationAuthority(op);

    // Owner is highest - return immediately
    if (authority === 'owner') {
      return 'owner';
    }

    // Active is higher than posting
    if (authority === 'active' && highestAuthority === 'posting') {
      highestAuthority = 'active';
    }

    // Memo is lowest (same level as posting)
    // If we see memo but only have posting, stick with posting
  }

  return highestAuthority;
}
