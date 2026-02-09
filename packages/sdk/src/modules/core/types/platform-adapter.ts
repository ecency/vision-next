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

  // ============================================================================
  // Platform-Specific Broadcasting
  // ============================================================================

  /**
   * Broadcast operations using Keychain extension (web only).
   *
   * @param username - Username to broadcast for
   * @param ops - Operations to broadcast
   * @param keyType - Key authority required
   * @returns Transaction confirmation
   *
   * @remarks
   * - Only available on web with Keychain extension installed
   * - Prompts user for approval via browser extension
   */
  broadcastWithKeychain?: (
    username: string,
    ops: Operation[],
    keyType: "Posting" | "Active" | "Owner" | "Memo"
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
