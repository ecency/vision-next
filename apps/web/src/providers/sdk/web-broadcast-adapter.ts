import { Operation, TransactionConfirmation, PrivateKey } from '@hiveio/dhive';
import {
  PlatformAdapter,
  getQueryClient,
  getAccountFullQueryOptions,
  CONFIG,
  buildAccountUpdateOp,
  type Authority,
} from '@ecency/sdk';

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
 * import { useGlobalStore } from '@/core/global-store';
 *
 * // Create a web-specific mutation hook wrapper
 * export function useVoteMutation() {
 *   const currentUser = useGlobalStore(state => state.activeUser);
 *   const adapter = createWebBroadcastAdapter();
 *
 *   return useVote(currentUser?.username, { adapter });
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
      // Web stores active user in 'active_user' key
      const activeUsername = localStorage.getItem('active_user');

      // Check if requested user is the active user
      if (activeUsername !== username) {
        return undefined;
      }

      // Fetch user data from user_${username} key
      const userDataStr = localStorage.getItem(`user_${username}`);
      if (!userDataStr) {
        return undefined;
      }

      try {
        const userData = JSON.parse(userDataStr);
        return {
          name: userData.username,
          authType: userData.loginType, // 'hivesigner' | 'keychain' | 'hiveauth' | 'privateKey'
        } as any;
      } catch (error) {
        console.error('[WebAdapter] Failed to parse user data:', error);
        return undefined;
      }
    },

    async getPostingKey(username: string) {
      const user = await this.getUser(username);
      if (!user) {
        return undefined;
      }

      const authType = user.authType;

      // Return null for HiveSigner/Keychain/HiveAuth (use their broadcast methods)
      if (authType === 'hivesigner' || authType === 'keychain' || authType === 'hiveauth') {
        return null;
      }

      // For privateKey auth type, retrieve from user object
      if (authType === 'privateKey') {
        const userDataStr = localStorage.getItem(`user_${username}`);
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            if (userData.postingKey) {
              // TODO: Decrypt key if encrypted
              return userData.postingKey;
            }
          } catch (error) {
            console.error('[WebAdapter] Failed to parse user data for posting key:', error);
          }
        }
      }

      return undefined;
    },

    async getActiveKey(username: string) {
      const user = await this.getUser(username);
      if (!user) {
        return undefined;
      }

      const authType = user.authType;

      // Return null for HiveSigner/Keychain/HiveAuth (use their broadcast methods)
      if (authType === 'hivesigner' || authType === 'keychain' || authType === 'hiveauth') {
        return null;
      }

      // Web app does NOT store active keys in localStorage for security
      // Active key operations will fall back to manual key entry or auth upgrade
      return undefined;
    },

    async getOwnerKey(username: string) {
      const user = await this.getUser(username);
      if (!user) {
        return undefined;
      }

      const authType = user.authType;

      // Return null for HiveSigner/Keychain/HiveAuth (use their broadcast methods)
      if (authType === 'hivesigner' || authType === 'keychain' || authType === 'hiveauth') {
        return null;
      }

      // Web app does NOT store owner keys in localStorage for security
      // Owner key operations will fall back to manual key entry or auth upgrade
      return undefined;
    },

    async getMemoKey(username: string) {
      const user = await this.getUser(username);
      if (!user) {
        return undefined;
      }

      const authType = user.authType;

      // Return null for HiveSigner/Keychain/HiveAuth (use their broadcast methods)
      if (authType === 'hivesigner' || authType === 'keychain' || authType === 'hiveauth') {
        return null;
      }

      // Web app does NOT store memo keys in localStorage for security
      // Memo key operations will fall back to manual key entry or auth upgrade
      return undefined;
    },

    async getAccessToken(username: string) {
      const user = await this.getUser(username);
      if (!user) {
        return undefined;
      }

      // Access tokens are used for:
      // 1. HiveSigner OAuth
      // 2. Private API access (drafts, bookmarks) for all login types
      // 3. Optimized posting broadcasts when posting authority granted
      const userDataStr = localStorage.getItem(`user_${username}`);
      if (userDataStr) {
        try {
          const userData = JSON.parse(userDataStr);
          if (userData.accessToken) {
            // Tokens are not encrypted in web app
            return userData.accessToken;
          }
        } catch (error) {
          console.error('[WebAdapter] Failed to parse user data for access token:', error);
        }
      }

      return undefined;
    },

    async getLoginType(username: string) {
      const user = await this.getUser(username);
      if (!user) {
        return null;
      }

      const authType = user.authType; // 'hivesigner' | 'keychain' | 'hiveauth' | 'privateKey'

      // Map web login types to SDK auth methods
      switch (authType) {
        case 'hivesigner':
          return 'hivesigner';
        case 'keychain':
          return 'keychain';
        case 'hiveauth':
          return 'keychain'; // HiveAuth uses same broadcast method as Keychain
        case 'privateKey':
          return 'key';
        default:
          return null;
      }
    },

    // ============================================================================
    // UI Feedback
    // ============================================================================

    showError(message: string, _type?: string) {
      // TODO: Integrate with web toast/notification system
      console.error('[WebAdapter]', message);
      // Example: showToast({ type: 'error', message });
    },

    showSuccess(message: string) {
      // TODO: Integrate with web toast/notification system
      console.log('[WebAdapter]', message);
      // Example: showToast({ type: 'success', message });
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
        keychain.requestBroadcast(
          username,
          ops,
          keyType,
          (response: any) => {
            if (response.success) {
              resolve(response.result);
            } else {
              reject(new Error(response.message || 'Keychain broadcast failed'));
            }
          }
        );
      });
    },

    // ============================================================================
    // Optional Platform Features
    // ============================================================================

    async recordActivity(activityType: number, blockNum: number, txId: string) {
      try {
        // TODO: Integrate with Ecency private API for user activity tracking
        console.log('[WebAdapter] Activity recorded:', { activityType, blockNum, txId });
      } catch (error) {
        // Don't throw on activity recording errors - it's not critical
        console.warn('[WebAdapter] Failed to record user activity:', error);
      }
    },

    async invalidateQueries(queryKeys: any[]) {
      const queryClient = getQueryClient();

      // Invalidate all queries in parallel to avoid await-in-loop
      await Promise.all(queryKeys.map((queryKey) => queryClient.invalidateQueries({ queryKey })));
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
    ): Promise<'hiveauth' | 'hivesigner' | 'key' | false> {
      // TODO: Implement auth upgrade modal component
      // For now, return false (user declined)
      console.warn(
        '[WebAdapter] Auth upgrade UI not implemented yet.',
        `Operation "${operation}" requires ${requiredAuthority} authority.`
      );
      return false;
    },

    async grantPostingAuthority(username: string): Promise<void> {
      const user = await this.getUser(username);
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
        console.log('[WebAdapter] Posting authority already granted');
        return;
      }

      // NOTE: Web app does not store active keys in localStorage for security.
      // Granting posting authority requires active key, which is only available:
      // 1. During login flow (handled by existing grantPostingPermission function)
      // 2. Via manual key entry (would need auth upgrade UI)
      //
      // This method cannot grant posting authority on web unless the user
      // goes through the auth upgrade flow to provide their active key.
      //
      // For now, we throw an error. Future enhancement: integrate with auth upgrade UI.
      throw new Error(
        'Cannot grant posting authority: Active key required but not stored. ' +
        'Please use master password or active key login to grant posting authority.'
      );
    },
  };
}
