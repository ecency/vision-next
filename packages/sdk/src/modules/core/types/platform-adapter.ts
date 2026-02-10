import type { Operation, TransactionConfirmation } from "@hiveio/dhive";

/**
 * Platform-specific adapter for SDK mutations.
 * Enables SDK to work across React Native (mobile) and Next.js (web).
 *
 * This interface allows the SDK to remain platform-agnostic while supporting
 * platform-specific features like encrypted storage (mobile), localStorage (web),
 * Keychain integration (web), and different state management solutions.
 *
 * @example
 * ```typescript
 * // Web adapter using localStorage and Zustand
 * const webAdapter: PlatformAdapter = {
 *   getUser: async (username) => localStorage.getItem(`user-${username}`),
 *   getPostingKey: async (username) => localStorage.getItem(`key-${username}`),
 *   showError: (msg) => toast.error(msg),
 *   showSuccess: (msg) => toast.success(msg),
 * };
 *
 * // Mobile adapter using Redux and encrypted storage
 * const mobileAdapter: PlatformAdapter = {
 *   getUser: async (username) => store.getState().users[username],
 *   getPostingKey: async (username) => decryptKey(username),
 *   showError: (msg) => Alert.alert('Error', msg),
 *   showSuccess: (msg) => Alert.alert('Success', msg),
 * };
 * ```
 */
export interface PlatformAdapter {
  // ============================================================================
  // Storage Operations
  // ============================================================================

  /**
   * Retrieve user data from platform-specific storage.
   *
   * @param username - The username to look up
   * @returns User object or undefined if not found
   *
   * @remarks
   * - Web: localStorage, Zustand store
   * - Mobile: Redux store, AsyncStorage with PIN decryption
   */
  getUser: (username: string) => Promise<User | undefined>;

  /**
   * Retrieve posting key from secure storage.
   *
   * @param username - The username to get key for
   * @returns Posting key (WIF format), null if Keychain/HiveAuth, undefined if not found
   *
   * @remarks
   * - Returns null for Keychain/HiveAuth users (use broadcastWithKeychain instead)
   * - Mobile: Decrypts key using PIN
   * - Web: Retrieves from localStorage
   */
  getPostingKey: (username: string) => Promise<string | null | undefined>;

  /**
   * Retrieve active key from secure storage (for transfers and other active operations).
   *
   * @param username - The username to get key for
   * @returns Active key (WIF format), null if Keychain/HiveAuth, undefined if not found
   *
   * @remarks
   * - Returns null for Keychain/HiveAuth users (use broadcastWithKeychain instead)
   * - Mobile: Decrypts key using PIN
   * - Web: Retrieves from localStorage
   * - Required for transfer, power down, and other active authority operations
   */
  getActiveKey?: (username: string) => Promise<string | null | undefined>;

  /**
   * Retrieve owner key from secure storage (for account recovery and password changes).
   *
   * @param username - The username to get key for
   * @returns Owner key (WIF format), null if Keychain/HiveAuth, undefined if not found
   *
   * @remarks
   * - Returns null for Keychain/HiveAuth users (use broadcastWithKeychain instead)
   * - Mobile: Decrypts key using PIN (only available for master password logins)
   * - Web: Retrieves from localStorage (only available for master password logins)
   * - Required for account recovery, password changes, and key rotation
   * - Most users won't have owner key stored - only master password logins
   */
  getOwnerKey?: (username: string) => Promise<string | null | undefined>;

  /**
   * Retrieve memo key from secure storage (for memo encryption/decryption).
   *
   * @param username - The username to get key for
   * @returns Memo key (WIF format), null if Keychain/HiveAuth, undefined if not found
   *
   * @remarks
   * - Returns null for Keychain/HiveAuth users
   * - Mobile: Decrypts key using PIN
   * - Web: Retrieves from localStorage
   * - Used for encrypting/decrypting transfer memos
   * - Rarely used for signing operations (mostly for encryption)
   */
  getMemoKey?: (username: string) => Promise<string | null | undefined>;

  /**
   * Retrieve HiveSigner access token from storage.
   *
   * @param username - The username to get token for
   * @returns Access token or undefined if not using HiveSigner
   */
  getAccessToken: (username: string) => Promise<string | undefined>;

  /**
   * Get the login method used for this user.
   *
   * @param username - The username to check
   * @returns Login type ('key', 'hivesigner', 'keychain', 'hiveauth') or null
   */
  getLoginType: (username: string) => Promise<string | null | undefined>;

  /**
   * Check if user has granted ecency.app posting authority.
   *
   * @param username - The username to check
   * @returns true if ecency.app is in posting.account_auths, false otherwise
   *
   * @remarks
   * Used to determine if posting operations can use HiveSigner access token
   * instead of requiring direct key signing or HiveAuth/Keychain.
   *
   * When posting authority is granted:
   * - Master password users: Can use token for faster posting ops
   * - Active key users: Can use token for posting ops (key for active ops)
   * - HiveAuth users: Can use token for faster posting ops (optional optimization)
   *
   * @example
   * ```typescript
   * const hasAuth = await adapter.hasPostingAuthorization('alice');
   * if (hasAuth) {
   *   // Use HiveSigner API with access token (faster)
   *   await broadcastWithToken(ops);
   * } else {
   *   // Use direct key signing or show grant prompt
   *   await broadcastWithKey(ops);
   * }
   * ```
   */
  hasPostingAuthorization?: (username: string) => Promise<boolean>;

  // ============================================================================
  // UI Feedback
  // ============================================================================

  /**
   * Display error message to user.
   *
   * @param message - Error message to display
   * @param type - Optional error type for categorization
   *
   * @remarks
   * - Web: toast.error()
   * - Mobile: Alert.alert(), custom error modal
   */
  showError: (message: string, type?: string) => void;

  /**
   * Display success message to user.
   *
   * @param message - Success message to display
   *
   * @remarks
   * - Web: toast.success()
   * - Mobile: Alert.alert(), custom success modal
   */
  showSuccess: (message: string) => void;

  /**
   * Display loading indicator (optional).
   *
   * @param message - Loading message to display
   */
  showLoading?: (message: string) => void;

  /**
   * Hide loading indicator (optional).
   */
  hideLoading?: () => void;

  /**
   * Show UI to prompt user to upgrade their auth method for an operation.
   *
   * @param requiredAuthority - The authority level needed ('posting' or 'active')
   * @param operation - Description of the operation requiring upgrade
   * @returns Promise that resolves to:
   *   - 'hiveauth' if user selected HiveAuth
   *   - 'hivesigner' if user selected HiveSigner
   *   - false if user cancelled/declined
   *
   * @remarks
   * Called when user's login method doesn't support the required operation:
   * - Posting key user trying active operation → needs active key
   * - No-key user trying any operation → needs auth method
   *
   * Platform should show modal/sheet offering:
   * 1. Sign with HiveAuth (if available)
   * 2. Sign with HiveSigner (if available)
   * 3. Enter active/posting key manually (temporary use)
   * 4. Cancel button
   *
   * Return the method user explicitly selected, allowing SDK to skip
   * unavailable methods and provide better error messages.
   *
   * @example
   * ```typescript
   * // User logged in with posting key tries to transfer
   * const method = await adapter.showAuthUpgradeUI('active', 'Transfer');
   * if (method === 'hiveauth') {
   *   await broadcastWithHiveAuth(ops);
   * } else if (method === 'hivesigner') {
   *   await broadcastWithHiveSigner(ops);
   * } else {
   *   // User cancelled
   *   throw new Error('Operation requires active authority');
   * }
   * ```
   */
  showAuthUpgradeUI?: (
    requiredAuthority: 'posting' | 'active',
    operation: string
  ) => Promise<'hiveauth' | 'hivesigner' | false>;

  // ============================================================================
  // Platform-Specific Broadcasting
  // ============================================================================

  /**
   * Broadcast operations using Keychain browser extension.
   *
   * @param username - Account broadcasting the operations
   * @param ops - Operations to broadcast
   * @param keyType - Authority level (lowercase: "posting", "active", "owner", "memo")
   * @returns Transaction confirmation
   *
   * @remarks
   * Web platform only. Implementations should map lowercase keyType to
   * Keychain's expected PascalCase format internally if needed.
   *
   * @example
   * ```typescript
   * async broadcastWithKeychain(username, ops, keyType) {
   *   // Map to Keychain's expected format
   *   const keychainKeyType = keyType.charAt(0).toUpperCase() + keyType.slice(1);
   *   return await window.hive_keychain.requestBroadcast(username, ops, keychainKeyType);
   * }
   * ```
   */
  broadcastWithKeychain?: (
    username: string,
    ops: Operation[],
    keyType: "posting" | "active" | "owner" | "memo"
  ) => Promise<TransactionConfirmation>;

  /**
   * Broadcast operations using HiveAuth protocol.
   *
   * @param username - Username to broadcast for
   * @param ops - Operations to broadcast
   * @param keyType - Key authority required
   * @returns Transaction confirmation
   *
   * @remarks
   * - Shows platform-specific HiveAuth modal/screen
   * - Generates QR code for mobile auth app
   * - Handles WebSocket communication with auth app
   */
  broadcastWithHiveAuth?: (
    username: string,
    ops: Operation[],
    keyType: "posting" | "active" | "owner" | "memo"
  ) => Promise<TransactionConfirmation>;

  // ============================================================================
  // Optional Platform Features
  // ============================================================================

  /**
   * Record user activity for analytics (optional).
   *
   * @param activityType - Numeric activity type code
   * @param blockNum - Block number of the activity
   * @param txId - Transaction ID
   *
   * @remarks
   * - Used for tracking user engagement
   * - Platform can implement custom analytics
   */
  recordActivity?: (
    activityType: number,
    blockNum: number,
    txId: string
  ) => Promise<void>;

  /**
   * Invalidate React Query cache keys (optional).
   *
   * @param keys - Array of query keys to invalidate
   *
   * @remarks
   * - Triggers refetch of cached data
   * - Used after mutations to update UI
   * - Example: [['posts', author, permlink], ['accountFull', username]]
   */
  invalidateQueries?: (keys: any[][]) => Promise<void>;

  /**
   * Grant ecency.app posting authority for the user (optional).
   *
   * @param username - The username to grant authority for
   * @returns Promise that resolves when authority is granted
   * @throws Error if grant fails or user doesn't have active key
   *
   * @remarks
   * Adds 'ecency.app' to the user's posting.account_auths with appropriate weight.
   * Requires active authority to broadcast the account_update operation.
   *
   * Called automatically during login for:
   * - Master password logins (has active key)
   * - Active key logins (has active key)
   * - BIP44 seed logins (has active key)
   *
   * Can be called manually for HiveAuth users as an optimization.
   *
   * After granting, posting operations can use HiveSigner API with access token
   * instead of requiring HiveAuth/Keychain each time (faster UX).
   *
   * @example
   * ```typescript
   * // Auto-grant on master password login
   * if (authType === 'master' && !hasPostingAuth) {
   *   await adapter.grantPostingAuthority(username);
   * }
   *
   * // Manual grant for HiveAuth optimization
   * if (authType === 'hiveauth' && userWantsOptimization) {
   *   await adapter.grantPostingAuthority(username);
   * }
   * ```
   */
  grantPostingAuthority?: (username: string) => Promise<void>;
}

/**
 * Authentication method types supported by the SDK.
 */
export type AuthMethod =
  | 'key'         // Direct private key (WIF format)
  | 'hiveauth'    // HiveAuth protocol (mobile app auth)
  | 'hivesigner'  // HiveSigner OAuth
  | 'keychain'    // Keychain browser extension
  | 'custom';     // Custom platform-specific method

/**
 * Minimal user type for platform adapters.
 * Platforms can extend this with their own user models.
 *
 * @example
 * ```typescript
 * // Web platform user
 * interface WebUser extends User {
 *   username: string;
 *   postingKey?: string;
 *   accessToken?: string;
 *   loginType: 'keychain' | 'hivesigner';
 * }
 *
 * // Mobile platform user
 * interface MobileUser extends User {
 *   name: string;
 *   local: {
 *     authType: 'key' | 'hiveauth';
 *     postingKey: string; // encrypted
 *   };
 * }
 * ```
 */
export interface User {
  /** Hive username */
  username?: string;
  /** Display name (alias for username on some platforms) */
  name?: string;
  /** Platform-specific user data */
  [key: string]: any;
}
