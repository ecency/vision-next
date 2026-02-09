import type { Operation } from "@hiveio/dhive";
import type { PlatformAdapter, AuthMethod } from "./platform-adapter";

/**
 * Original AuthContext for backward compatibility.
 *
 * This interface is maintained for existing SDK consumers who pass
 * auth context directly to mutations.
 *
 * @deprecated Use AuthContextV2 for new implementations to enable platform adapters.
 *
 * @example
 * ```typescript
 * // Legacy usage (still supported)
 * const authContext: AuthContext = {
 *   postingKey: 'wif-key',
 *   accessToken: 'hs-token',
 *   loginType: 'hivesigner'
 * };
 * ```
 */
export interface AuthContext {
  /** HiveSigner OAuth access token */
  accessToken?: string;
  /** Posting key in WIF format (null for Keychain/HiveAuth users) */
  postingKey?: string | null;
  /** Login method used ('key', 'hivesigner', 'keychain', 'hiveauth') */
  loginType?: string | null;
  /**
   * Custom broadcast function for platform-specific signing.
   * @deprecated Use platform adapter's broadcastWithKeychain/broadcastWithHiveAuth instead.
   */
  broadcast?: (
    operations: Operation[],
    authority?: "active" | "posting" | "owner" | "memo"
  ) => Promise<unknown>;
}

/**
 * Enhanced AuthContext with platform adapter support.
 * Backward compatible with AuthContext.
 *
 * This is the recommended interface for new SDK integrations. It enables
 * platform-specific features while keeping the SDK agnostic of implementation details.
 *
 * @example
 * ```typescript
 * // Web usage with platform adapter
 * const authContext: AuthContextV2 = {
 *   adapter: {
 *     getUser: async (username) => getUserFromZustand(username),
 *     getPostingKey: async (username) => localStorage.getItem(`key-${username}`),
 *     showError: (msg) => toast.error(msg),
 *     showSuccess: (msg) => toast.success(msg),
 *     broadcastWithKeychain: async (username, ops, keyType) => {
 *       // Map lowercase to Keychain's PascalCase format
 *       const keychainKeyType = keyType.charAt(0).toUpperCase() + keyType.slice(1);
 *       return window.hive_keychain.requestBroadcast(username, ops, keychainKeyType);
 *     },
 *   },
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner'],
 * };
 *
 * // Mobile usage with platform adapter
 * const authContext: AuthContextV2 = {
 *   adapter: {
 *     getUser: async (username) => store.getState().users[username],
 *     getPostingKey: async (username) => decryptKey(username, pin),
 *     showError: (msg) => Alert.alert('Error', msg),
 *     showSuccess: (msg) => Alert.alert('Success', msg),
 *     broadcastWithHiveAuth: async (username, ops, keyType) => {
 *       return showHiveAuthModal(username, ops, keyType);
 *     },
 *   },
 *   enableFallback: true,
 *   fallbackChain: ['hiveauth', 'key'],
 * };
 *
 * // Legacy usage (still works)
 * const authContext: AuthContextV2 = {
 *   postingKey: 'wif-key',
 *   loginType: 'key',
 * };
 * ```
 */
export interface AuthContextV2 extends AuthContext {
  /**
   * Platform-specific adapter for storage, UI, and broadcasting.
   *
   * When provided, the SDK will use the adapter to:
   * - Retrieve user credentials from platform storage
   * - Show error/success messages in platform UI
   * - Broadcast operations using platform-specific methods (Keychain, HiveAuth)
   * - Invalidate React Query caches after mutations
   *
   * @remarks
   * If not provided, SDK falls back to using postingKey/accessToken directly.
   */
  adapter?: PlatformAdapter;

  /**
   * Whether to enable automatic fallback between auth methods.
   *
   * @remarks
   * The actual behavior is:
   * - When adapter is provided: defaults to true (fallback enabled)
   * - When no adapter: defaults to false (legacy behavior)
   *
   * This is evaluated at runtime as: `auth?.enableFallback !== false && auth?.adapter`
   *
   * Set to `false` explicitly to disable fallback even with an adapter.
   *
   * @default undefined (evaluated as true when adapter exists, false otherwise)
   *
   * @example
   * ```typescript
   * // User has Keychain but it fails -> try posting key -> try HiveSigner
   * const authContext: AuthContextV2 = {
   *   adapter: myAdapter,
   *   enableFallback: true,
   *   fallbackChain: ['keychain', 'key', 'hivesigner'],
   * };
   * ```
   */
  enableFallback?: boolean;

  /**
   * Order of authentication methods to try during fallback.
   *
   * Available methods:
   * - 'key': Direct private key (adapter.getPostingKey or getActiveKey)
   * - 'hiveauth': HiveAuth protocol (adapter.broadcastWithHiveAuth)
   * - 'hivesigner': HiveSigner OAuth (adapter.getAccessToken)
   * - 'keychain': Keychain extension (adapter.broadcastWithKeychain)
   * - 'custom': Use AuthContext.broadcast()
   *
   * @default ['key', 'hiveauth', 'hivesigner', 'keychain', 'custom']
   *
   * @remarks
   * Set this to customize the order or exclude methods. For example:
   * - Mobile priority: ['hiveauth', 'hivesigner', 'key']
   * - Web priority: ['keychain', 'key', 'hivesigner']
   *
   * @see broadcastWithFallback for the runtime implementation
   */
  fallbackChain?: AuthMethod[];
}
