import { Operation, TransactionConfirmation, PrivateKey } from '@hiveio/dhive';
import {
  PlatformAdapter,
  getQueryClient,
  getAccountFullQueryOptions,
  CONFIG,
  buildGrantPostingPermissionOp,
  usrActivity,
  type Authority,
} from '@ecency/sdk';
import hs from 'hivesigner';
import { getUser, getAccessToken, getPostingKey, getLoginType } from '@/utils/user-token';
import * as ls from '@/utils/local-storage';
import { broadcastWithHiveAuth } from '@/utils/hive-auth';
import { requestAuthUpgrade, getTempActiveKey, clearTempActiveKey } from '@/features/shared/auth-upgrade';
import { error, success } from '@/features/shared/feedback/feedback-events';

/**
 * Web platform adapter for SDK mutations.
 *
 * Bridges the SDK's authentication context with the web app's:
 * - localStorage for user state
 * - Browser-based key storage
 * - Keychain browser extension integration
 * - HiveSigner OAuth integration
 * - React Query cache invalidation
 *
 * @returns {PlatformAdapter} Platform adapter instance configured for web
 *
 * @example
 * ```typescript
 * import { createWebBroadcastAdapter } from '@/providers/sdk';
 * import { useVote } from '@ecency/sdk';
 * import { useActiveAccount } from '@/core/hooks';
 *
 * // Create a web-specific mutation hook wrapper
 * export function useVoteMutation() {
 *   const { username } = useActiveAccount();
 *   const adapter = createWebBroadcastAdapter();
 *
 *   return useVote(username, { adapter });
 * }
 *
 * // Now use the wrapper in components
 * const { mutate: vote } = useVoteMutation();
 * vote({ author: 'ecency', permlink: 'welcome', weight: 10000 });
 * ```
 *
 * @remarks
 * Following the mobile pattern, each mutation hook wrapper creates its own adapter
 * instance and passes it to the SDK mutation hook. Creating adapters is lightweight.
 *
 * The adapter integrates with:
 * - **localStorage**: Persistent storage for user data and encrypted keys
 * - **sessionStorage**: Temporary storage for session-only data
 * - **Keychain**: Browser extension for secure key management
 * - **HiveSigner**: OAuth-based authentication
 * - **React Query**: Cache invalidation after mutations
 *
 * @see {@link PlatformAdapter} for the full interface definition
 */
export function createWebBroadcastAdapter(): PlatformAdapter {
  return {
    // ============================================================================
    // Storage Operations
    // ============================================================================

    async getUser(username: string) {
      // Use existing user-token helper for consistent localStorage access
      const user = getUser(username);
      if (!user) {
        return undefined;
      }

      // Map loginType to SDK auth method (same mapping as getLoginType)
      const authType = user.loginType === 'privateKey' ? 'key' : user.loginType;

      return {
        name: user.username,
        authType, // 'hivesigner' | 'keychain' | 'hiveauth' | 'key'
      };
    },

    async getPostingKey(username: string) {
      // Use existing helper - it handles localStorage access and decoding
      const postingKey = getPostingKey(username);

      // Return null for non-key auth methods (HiveSigner/Keychain/HiveAuth)
      // This signals to SDK that it should use those platform-specific broadcast methods
      const loginType = getLoginType(username);
      if (loginType === 'hivesigner' || loginType === 'keychain' || loginType === 'hiveauth') {
        return null;
      }

      // For privateKey auth, return the key (may be undefined if not stored)
      return postingKey;
    },

    async getActiveKey(username: string) {
      // Check temp storage first (key entered via auth upgrade dialog)
      const tempKey = getTempActiveKey();
      if (tempKey) return tempKey;

      // Return null for non-key auth methods (they handle active operations via their own methods)
      const loginType = getLoginType(username);
      if (loginType === 'hivesigner' || loginType === 'keychain' || loginType === 'hiveauth') {
        return null;
      }

      // Web app does NOT store active keys in localStorage for security
      // Active key operations will fall back to auth upgrade dialog
      return undefined;
    },

    async getOwnerKey(username: string) {
      // Return null for non-key auth methods (they handle owner operations via their own methods)
      const loginType = getLoginType(username);
      if (loginType === 'hivesigner' || loginType === 'keychain' || loginType === 'hiveauth') {
        return null;
      }

      // Web app does NOT store owner keys in localStorage for security
      // Owner key operations will fall back to manual key entry or auth upgrade
      return undefined;
    },

    async getMemoKey(username: string) {
      // Return null for non-key auth methods (they handle memo operations via their own methods)
      const loginType = getLoginType(username);
      if (loginType === 'hivesigner' || loginType === 'keychain' || loginType === 'hiveauth') {
        return null;
      }

      // Web app does NOT store memo keys in localStorage for security
      // Memo key operations will fall back to manual key entry or auth upgrade
      return undefined;
    },

    async getAccessToken(username: string) {
      // Use existing helper - it handles localStorage access and decoding
      // Access tokens are used for:
      // 1. HiveSigner OAuth
      // 2. Private API access (drafts, bookmarks) for all login types
      // 3. Optimized posting broadcasts when posting authority granted
      return getAccessToken(username);
    },

    async getLoginType(username: string, authority?: string) {
      // Use existing helper - it handles localStorage access and decoding
      const loginType = getLoginType(username);
      if (!loginType) {
        return null;
      }

      // Map web login types to SDK auth methods
      // LoginType = 'hivesigner' | 'keychain' | 'hiveauth' | 'privateKey'
      switch (loginType) {
        case 'hivesigner':
          return 'hivesigner';
        case 'keychain':
          return 'keychain';
        case 'hiveauth':
          return 'hiveauth'; // HiveAuth has its own broadcast method (QR code + mobile app flow)
        case 'privateKey':
          // For key-based logins, verify the required key is actually available.
          // An active-key-only user shouldn't return 'key' for posting ops —
          // returning null lets broadcastWithFallback use HiveSigner token
          // or show auth upgrade UI instead of failing on a missing key.
          if (authority === 'posting') {
            const postingKey = getPostingKey(username);
            if (!postingKey) return null;
          }
          return 'key';
        default:
          return null;
      }
    },

    // ============================================================================
    // UI Feedback
    // ============================================================================

    showError(message: string, _type?: string) {
      error(message);
    },

    showSuccess(message: string) {
      success(message);
    },

    // ============================================================================
    // Platform-Specific Broadcasting
    // ============================================================================

    async broadcastWithKeychain(
      username: string,
      ops: Operation[],
      keyType: 'posting' | 'active' | 'owner' | 'memo',
    ): Promise<TransactionConfirmation> {
      // Check if Keychain is available
      if (typeof window === 'undefined' || !(window as any).hive_keychain) {
        throw new Error('Hive Keychain extension not found. Please install it from the Chrome/Firefox store.');
      }

      const keychain = (window as any).hive_keychain;

      return new Promise((resolve, reject) => {
        let settled = false;
        let timeoutId: NodeJS.Timeout | undefined;

        // Cleanup function to prevent memory leaks
        const cleanup = () => {
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = undefined;
          }
        };

        // Set timeout (60 seconds for user interaction)
        timeoutId = setTimeout(() => {
          if (!settled) {
            settled = true;
            cleanup();
            reject(new Error(
              'Keychain request timed out. Please try again or check if Keychain extension is responding.'
            ));
          }
        }, 60000);

        // Request broadcast from Keychain
        keychain.requestBroadcast(
          username,
          ops,
          keyType,
          (response: any) => {
            if (!settled) {
              settled = true;
              cleanup();

              if (response.success) {
                resolve(response.result);
              } else {
                reject(new Error(response.message || 'Keychain broadcast failed'));
              }
            }
            // Ignore callback if already settled (timeout fired first)
          }
        );
      });
    },

    async broadcastWithHiveAuth(
      username: string,
      ops: Operation[],
      keyType: 'posting' | 'active' | 'owner' | 'memo',
    ): Promise<TransactionConfirmation> {
      // HiveAuth only supports posting and active keys
      if (keyType !== 'posting' && keyType !== 'active') {
        throw new Error(`HiveAuth does not support ${keyType} authority. Use posting or active only.`);
      }

      // Use existing HiveAuth utility from web app
      // This handles QR code generation, mobile app communication, and session management
      return await broadcastWithHiveAuth(username, ops, keyType);
    },

    // ============================================================================
    // Optional Platform Features
    // ============================================================================

    async recordActivity(activityType: number, blockNum: number, txId: string) {
      try {
        const activeUsername = ls.get("active_user");
        if (!activeUsername) return;
        const token = getAccessToken(activeUsername);
        if (!token) return;
        await usrActivity(token, activityType, blockNum, txId);
      } catch (e) {
        // Don't throw on activity recording errors - it's not critical
        console.warn('[WebAdapter] Failed to record user activity:', e);
      }
    },

    async invalidateQueries(queryKeys: any[]) {
      const queryClient = getQueryClient();

      // Invalidate all queries in parallel to avoid await-in-loop
      // Support both array query keys and predicate-based invalidation
      await Promise.all(
        queryKeys
          .filter(Boolean) // Guard against null/undefined to prevent invalidating ALL queries
          .map((entry) =>
            // Check if this is a predicate object (has predicate property)
            entry && typeof entry === 'object' && 'predicate' in entry
              ? queryClient.invalidateQueries({ predicate: entry.predicate })
              : queryClient.invalidateQueries({ queryKey: entry })
          )
      );
    },

    // ============================================================================
    // Smart Auth Strategy Methods
    // ============================================================================

    async hasPostingAuthorization(username: string): Promise<boolean> {
      try {
        const queryClient = getQueryClient();
        const accountData = await queryClient.fetchQuery(getAccountFullQueryOptions(username));

        if (!accountData?.posting?.account_auths) {
          return false;
        }

        // Check if ecency.app is in posting.account_auths
        return accountData.posting.account_auths.some(
          ([account, _weight]: [string, number]) => account === 'ecency.app',
        );
      } catch (error) {
        console.warn('[WebAdapter] Failed to check posting authorization:', error);
        return false;
      }
    },

    async showAuthUpgradeUI(
      requiredAuthority: 'posting' | 'active',
      operation: string,
    ): Promise<'hiveauth' | 'hivesigner' | 'keychain' | 'key' | false> {
      return requestAuthUpgrade(requiredAuthority, operation);
    },

    async grantPostingAuthority(username: string): Promise<void> {
      const user = getUser(username);
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Fetch current account data
      const queryClient = getQueryClient();
      const accountData = await queryClient.fetchQuery(getAccountFullQueryOptions(username));

      if (!accountData) {
        throw new Error('Failed to fetch account data');
      }

      // Check if already granted
      const alreadyGranted = accountData.posting?.account_auths?.some(
        ([account, _weight]: [string, number]) => account === 'ecency.app',
      );

      if (alreadyGranted) {
        return;
      }

      // Show auth upgrade dialog to get active authority
      const method = await requestAuthUpgrade('active', 'Grant posting authority');
      if (method === false) {
        // User cancelled - granting is optional, return silently
        return;
      }

      // Build the grant posting permission operation
      const op = buildGrantPostingPermissionOp(
        username,
        accountData.posting,
        'ecency.app',
        1,
        accountData.memo_key,
        accountData.json_metadata || '',
      );

      // Broadcast based on selected method
      switch (method) {
        case 'key': {
          const activeKey = getTempActiveKey();
          if (!activeKey) {
            throw new Error('Active key not provided');
          }
          const privateKey = PrivateKey.fromString(activeKey);
          await CONFIG.hiveClient.broadcast.sendOperations([op], privateKey);
          clearTempActiveKey();
          break;
        }
        case 'keychain': {
          if (typeof window === 'undefined' || !(window as any).hive_keychain) {
            throw new Error('Hive Keychain extension not found');
          }
          const keychain = (window as any).hive_keychain;
          await new Promise<void>((resolve, reject) => {
            keychain.requestBroadcast(username, [op], 'active', (response: any) => {
              if (response.success) {
                resolve();
              } else {
                reject(new Error(response.message || 'Keychain broadcast failed'));
              }
            });
          });
          break;
        }
        case 'hiveauth': {
          await broadcastWithHiveAuth(username, [op], 'active');
          break;
        }
        case 'hivesigner': {
          const token = getAccessToken(username);
          if (!token) {
            throw new Error('HiveSigner access token not found');
          }
          const client = new hs.Client({ accessToken: token });
          await client.broadcast([op]);
          break;
        }
      }

      // Invalidate account query cache after success
      await queryClient.invalidateQueries({
        queryKey: getAccountFullQueryOptions(username).queryKey,
      });
    },
  };
}
