import { Operation } from "@hiveio/dhive";

/**
 * Account Operations
 * Operations for managing accounts, keys, and permissions
 */

/**
 * Authority structure for account operations
 */
export interface Authority {
  weight_threshold: number;
  account_auths: [string, number][];
  key_auths: [string, number][];
}

/**
 * Builds an account update operation.
 * @param account - Account name
 * @param owner - Owner authority (optional)
 * @param active - Active authority (optional)
 * @param posting - Posting authority (optional)
 * @param memoKey - Memo public key
 * @param jsonMetadata - Account JSON metadata
 * @returns Account update operation
 */
export function buildAccountUpdateOp(
  account: string,
  owner: Authority | undefined,
  active: Authority | undefined,
  posting: Authority | undefined,
  memoKey: string,
  jsonMetadata: string
): Operation {
  if (!account || !memoKey) {
    throw new Error("[SDK][buildAccountUpdateOp] Missing required parameters");
  }

  return [
    "account_update",
    {
      account,
      owner,
      active,
      posting,
      memo_key: memoKey,
      json_metadata: jsonMetadata,
    },
  ];
}

/**
 * Builds an account update2 operation (for posting_json_metadata).
 * @param account - Account name
 * @param jsonMetadata - Account JSON metadata (legacy, usually empty)
 * @param postingJsonMetadata - Posting JSON metadata string
 * @param extensions - Extensions array
 * @returns Account update2 operation
 */
export function buildAccountUpdate2Op(
  account: string,
  jsonMetadata: string,
  postingJsonMetadata: string,
  extensions: any[]
): Operation {
  if (!account || postingJsonMetadata === undefined) {
    throw new Error("[SDK][buildAccountUpdate2Op] Missing required parameters");
  }

  return [
    "account_update2",
    {
      account,
      json_metadata: jsonMetadata || "",
      posting_json_metadata: postingJsonMetadata,
      extensions: extensions || [],
    },
  ];
}

/**
 * Public keys for account creation
 */
export interface AccountKeys {
  ownerPublicKey: string;
  activePublicKey: string;
  postingPublicKey: string;
  memoPublicKey: string;
}

/**
 * Builds an account create operation.
 * @param creator - Creator account name
 * @param newAccountName - New account name
 * @param keys - Public keys for the new account
 * @param fee - Creation fee (e.g., "3.000 HIVE")
 * @returns Account create operation
 */
export function buildAccountCreateOp(
  creator: string,
  newAccountName: string,
  keys: AccountKeys,
  fee: string
): Operation {
  if (!creator || !newAccountName || !keys || !fee) {
    throw new Error("[SDK][buildAccountCreateOp] Missing required parameters");
  }

  const owner: Authority = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[keys.ownerPublicKey, 1]],
  };

  const active: Authority = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[keys.activePublicKey, 1]],
  };

  const posting: Authority = {
    weight_threshold: 1,
    account_auths: [["ecency.app", 1]],
    key_auths: [[keys.postingPublicKey, 1]],
  };

  return [
    "account_create",
    {
      creator,
      new_account_name: newAccountName,
      owner,
      active,
      posting,
      memo_key: keys.memoPublicKey,
      json_metadata: "",
      extensions: [],
      fee,
    },
  ];
}

/**
 * Builds a create claimed account operation (using account creation tokens).
 * @param creator - Creator account name
 * @param newAccountName - New account name
 * @param keys - Public keys for the new account
 * @returns Create claimed account operation
 */
export function buildCreateClaimedAccountOp(
  creator: string,
  newAccountName: string,
  keys: AccountKeys
): Operation {
  if (!creator || !newAccountName || !keys) {
    throw new Error("[SDK][buildCreateClaimedAccountOp] Missing required parameters");
  }

  const owner: Authority = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[keys.ownerPublicKey, 1]],
  };

  const active: Authority = {
    weight_threshold: 1,
    account_auths: [],
    key_auths: [[keys.activePublicKey, 1]],
  };

  const posting: Authority = {
    weight_threshold: 1,
    account_auths: [["ecency.app", 1]],
    key_auths: [[keys.postingPublicKey, 1]],
  };

  return [
    "create_claimed_account",
    {
      creator,
      new_account_name: newAccountName,
      owner,
      active,
      posting,
      memo_key: keys.memoPublicKey,
      json_metadata: "",
      extensions: [],
    },
  ];
}

/**
 * Builds a claim account operation.
 * @param creator - Account claiming the token
 * @param fee - Fee for claiming (usually "0.000 HIVE" for RC-based claims)
 * @returns Claim account operation
 */
export function buildClaimAccountOp(creator: string, fee: string): Operation {
  if (!creator || !fee) {
    throw new Error("[SDK][buildClaimAccountOp] Missing required parameters");
  }

  return [
    "claim_account",
    {
      creator,
      fee,
      extensions: [],
    },
  ];
}

/**
 * Builds an operation to grant posting permission to another account.
 * Helper that modifies posting authority to add an account.
 * @param account - Account granting permission
 * @param currentPosting - Current posting authority
 * @param grantedAccount - Account to grant permission to
 * @param weightThreshold - Weight threshold of the granted account
 * @param memoKey - Memo public key (required by Hive blockchain)
 * @param jsonMetadata - Account JSON metadata (required by Hive blockchain)
 * @returns Account update operation with modified posting authority
 */
export function buildGrantPostingPermissionOp(
  account: string,
  currentPosting: Authority,
  grantedAccount: string,
  weightThreshold: number,
  memoKey: string,
  jsonMetadata: string
): Operation {
  if (!account || !currentPosting || !grantedAccount || !memoKey) {
    throw new Error("[SDK][buildGrantPostingPermissionOp] Missing required parameters");
  }

  // Find existing account or create new entry to prevent duplicates
  const existingIndex = currentPosting.account_auths.findIndex(
    ([acc]) => acc === grantedAccount
  );

  const newAccountAuths = [...currentPosting.account_auths];
  if (existingIndex >= 0) {
    // Update existing entry with new weight
    newAccountAuths[existingIndex] = [grantedAccount, weightThreshold];
  } else {
    // Add new entry
    newAccountAuths.push([grantedAccount, weightThreshold]);
  }

  const newPosting: Authority = {
    ...currentPosting,
    account_auths: newAccountAuths,
  };

  // Sort account_auths alphabetically for consistency
  newPosting.account_auths.sort((a, b) => (a[0] > b[0] ? 1 : -1));

  return [
    "account_update",
    {
      account,
      posting: newPosting,
      memo_key: memoKey,
      json_metadata: jsonMetadata,
    },
  ];
}

/**
 * Builds an operation to revoke posting permission from an account.
 * Helper that modifies posting authority to remove an account.
 * @param account - Account revoking permission
 * @param currentPosting - Current posting authority
 * @param revokedAccount - Account to revoke permission from
 * @param memoKey - Memo public key (required by Hive blockchain)
 * @param jsonMetadata - Account JSON metadata (required by Hive blockchain)
 * @returns Account update operation with modified posting authority
 */
export function buildRevokePostingPermissionOp(
  account: string,
  currentPosting: Authority,
  revokedAccount: string,
  memoKey: string,
  jsonMetadata: string
): Operation {
  if (!account || !currentPosting || !revokedAccount || !memoKey) {
    throw new Error("[SDK][buildRevokePostingPermissionOp] Missing required parameters");
  }

  const newPosting: Authority = {
    ...currentPosting,
    account_auths: currentPosting.account_auths.filter(
      ([acc]) => acc !== revokedAccount
    ),
  };

  return [
    "account_update",
    {
      account,
      posting: newPosting,
      memo_key: memoKey,
      json_metadata: jsonMetadata,
    },
  ];
}

/**
 * Builds a change recovery account operation.
 * @param accountToRecover - Account to change recovery account for
 * @param newRecoveryAccount - New recovery account name
 * @param extensions - Extensions array
 * @returns Change recovery account operation
 */
export function buildChangeRecoveryAccountOp(
  accountToRecover: string,
  newRecoveryAccount: string,
  extensions: any[] = []
): Operation {
  if (!accountToRecover || !newRecoveryAccount) {
    throw new Error("[SDK][buildChangeRecoveryAccountOp] Missing required parameters");
  }

  return [
    "change_recovery_account",
    {
      account_to_recover: accountToRecover,
      new_recovery_account: newRecoveryAccount,
      extensions,
    },
  ];
}

/**
 * Builds a request account recovery operation.
 * @param recoveryAccount - Recovery account performing the recovery
 * @param accountToRecover - Account to recover
 * @param newOwnerAuthority - New owner authority
 * @param extensions - Extensions array
 * @returns Request account recovery operation
 */
export function buildRequestAccountRecoveryOp(
  recoveryAccount: string,
  accountToRecover: string,
  newOwnerAuthority: Authority,
  extensions: any[] = []
): Operation {
  if (!recoveryAccount || !accountToRecover || !newOwnerAuthority) {
    throw new Error("[SDK][buildRequestAccountRecoveryOp] Missing required parameters");
  }

  return [
    "request_account_recovery",
    {
      recovery_account: recoveryAccount,
      account_to_recover: accountToRecover,
      new_owner_authority: newOwnerAuthority,
      extensions,
    },
  ];
}

/**
 * Builds a recover account operation.
 * @param accountToRecover - Account to recover
 * @param newOwnerAuthority - New owner authority
 * @param recentOwnerAuthority - Recent owner authority (for proof)
 * @param extensions - Extensions array
 * @returns Recover account operation
 */
export function buildRecoverAccountOp(
  accountToRecover: string,
  newOwnerAuthority: Authority,
  recentOwnerAuthority: Authority,
  extensions: any[] = []
): Operation {
  if (!accountToRecover || !newOwnerAuthority || !recentOwnerAuthority) {
    throw new Error("[SDK][buildRecoverAccountOp] Missing required parameters");
  }

  return [
    "recover_account",
    {
      account_to_recover: accountToRecover,
      new_owner_authority: newOwnerAuthority,
      recent_owner_authority: recentOwnerAuthority,
      extensions,
    },
  ];
}
