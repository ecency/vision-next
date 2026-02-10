import {
  useMutation,
  type MutationKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { Operation, PrivateKey, TransactionConfirmation } from "@hiveio/dhive";
import { CONFIG } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { shouldTriggerAuthFallback } from "@/modules/core/errors";
import type { AuthorityLevel } from "@/modules/operations/authority-map";
import hs from "hivesigner";

/**
 * Broadcasts operations using a specific auth method.
 *
 * @param method - Auth method to use ('key', 'hiveauth', 'hivesigner', 'keychain', 'custom')
 * @param username - Hive username to broadcast for
 * @param ops - Operations to broadcast
 * @param auth - AuthContextV2 with adapter and configuration
 * @param authority - Key authority to use (posting, active, owner, or memo)
 * @returns Transaction confirmation from the blockchain
 * @throws Error if method is not available or broadcast fails
 */
async function broadcastWithMethod(
  method: string,
  username: string,
  ops: Operation[],
  auth?: AuthContextV2,
  authority: AuthorityLevel = 'posting'
): Promise<TransactionConfirmation> {
  const adapter = auth?.adapter;

  switch (method) {
    case 'key': {
      if (!adapter) {
        throw new Error('No adapter provided for key-based auth');
      }

      // Choose key based on authority
      let key: string | null | undefined;

      switch (authority) {
        case 'owner':
          if (adapter.getOwnerKey) {
            key = await adapter.getOwnerKey(username);
          } else {
            throw new Error(
              `Owner key not supported by adapter. Owner operations (like account recovery) ` +
              `require master password login or manual key entry.`
            );
          }
          break;

        case 'active':
          if (adapter.getActiveKey) {
            key = await adapter.getActiveKey(username);
          }
          break;

        case 'memo':
          if (adapter.getMemoKey) {
            key = await adapter.getMemoKey(username);
          } else {
            throw new Error(
              `Memo key not supported by adapter. Use memo encryption methods instead.`
            );
          }
          break;

        case 'posting':
        default:
          key = await adapter.getPostingKey(username);
          break;
      }

      if (!key) {
        throw new Error(`No ${authority} key available for ${username}`);
      }

      // Attempt broadcast with key
      const privateKey = PrivateKey.fromString(key);
      return await CONFIG.hiveClient.broadcast.sendOperations(ops, privateKey);
    }

    case 'hiveauth': {
      if (!adapter?.broadcastWithHiveAuth) {
        throw new Error('HiveAuth not supported by adapter');
      }
      return await adapter.broadcastWithHiveAuth(username, ops, authority);
    }

    case 'hivesigner': {
      if (!adapter) {
        throw new Error('No adapter provided for HiveSigner auth');
      }
      const token = await adapter.getAccessToken(username);
      if (!token) {
        throw new Error(`No access token available for ${username}`);
      }
      const client = new hs.Client({ accessToken: token });
      const response = await client.broadcast(ops);
      return response.result;
    }

    case 'keychain': {
      if (!adapter?.broadcastWithKeychain) {
        throw new Error('Keychain not supported by adapter');
      }
      return await adapter.broadcastWithKeychain(username, ops, authority);
    }

    case 'custom': {
      if (!auth?.broadcast) {
        throw new Error('No custom broadcast function provided');
      }
      return (await auth.broadcast(ops, authority)) as TransactionConfirmation;
    }

    default:
      throw new Error(`Unknown auth method: ${method}`);
  }
}

/**
 * Attempts to broadcast operations using multiple auth methods in fallback chain.
 * Implements sophisticated fallback pattern from mobile app.
 *
 * @param username - Hive username to broadcast for
 * @param ops - Operations to broadcast
 * @param auth - AuthContextV2 with adapter and fallback configuration
 * @param authority - Key authority to use ('posting' | 'active' | 'owner' | 'memo'), defaults to 'posting'
 * @returns Transaction confirmation from the blockchain
 * @throws Error if all auth methods fail or if a non-auth error occurs
 *
 * @remarks
 * **Preferred Behavior (when adapter.getLoginType exists):**
 * - Calls adapter.getLoginType() to determine user's actual auth method
 * - Uses ONLY that method (no fallbacks) - more predictable and faster
 * - If it fails, throws the error immediately
 *
 * **Fallback Behavior (for backward compatibility):**
 * - Tries each auth method in the fallback chain order
 * - Only continues to next method if error is auth-related (missing authority, token expired)
 * - Stops immediately for non-auth errors (RC exhaustion, network errors, validation errors)
 * - Collects all errors and provides detailed failure message
 *
 * @example
 * ```typescript
 * // Preferred: Adapter with getLoginType (single method, no fallbacks)
 * const auth: AuthContextV2 = {
 *   adapter: myAdapter, // includes getLoginType()
 * };
 *
 * // Legacy: Explicit fallback chain (tries multiple methods)
 * const auth: AuthContextV2 = {
 *   adapter: myAdapter,
 *   fallbackChain: ['key', 'hiveauth', 'hivesigner'],
 * };
 * ```
 */
async function broadcastWithFallback(
  username: string,
  ops: Operation[],
  auth?: AuthContextV2,
  authority: AuthorityLevel = 'posting'
): Promise<TransactionConfirmation> {
  const adapter = auth?.adapter;

  // PREFERRED APPROACH: If adapter provides getLoginType, use smart auth strategy
  // This avoids unnecessary fallback attempts and is more predictable
  if (adapter?.getLoginType) {
    const loginType = await adapter.getLoginType(username);

    if (loginType) {
      // SMART AUTH STRATEGY: Optimize based on login type + authority + credentials

      // Check if user has granted ecency.app posting authority
      const hasPostingAuth = adapter.hasPostingAuthorization
        ? await adapter.hasPostingAuthorization(username)
        : false;

      // OPTIMIZATION: Use HiveSigner token for posting ops when posting auth is granted
      // This is faster than direct key signing or HiveAuth for key-based logins
      if (
        authority === 'posting' &&
        hasPostingAuth &&
        loginType === 'key'
      ) {
        try {
          // Try HiveSigner API first (faster)
          return await broadcastWithMethod('hivesigner', username, ops, auth, authority);
        } catch (error) {
          // Fallback to direct key signing if token method fails
          console.warn('[SDK] HiveSigner token failed, falling back to key:', error);
        }
      }

      // OPTIMIZATION: Use HiveSigner token for HiveAuth users with posting auth (faster)
      if (
        authority === 'posting' &&
        hasPostingAuth &&
        loginType === 'hiveauth'
      ) {
        try {
          // Try HiveSigner API first (faster)
          return await broadcastWithMethod('hivesigner', username, ops, auth, authority);
        } catch (error) {
          // Fallback to HiveAuth if token method fails
          console.warn('[SDK] HiveSigner token failed, falling back to HiveAuth:', error);
        }
      }

      // Use user's actual login method
      try {
        return await broadcastWithMethod(loginType, username, ops, auth, authority);
      } catch (error) {
        // Check if error is due to missing authority (e.g., posting key trying active op)
        if (shouldTriggerAuthFallback(error)) {
          // Show auth upgrade UI if available (only for posting/active operations)
          if (
            adapter.showAuthUpgradeUI &&
            (authority === 'posting' || authority === 'active')
          ) {
            const selectedMethod = await adapter.showAuthUpgradeUI(authority, ops[0][0]);
            if (!selectedMethod) {
              throw new Error(`Operation requires ${authority} authority. User declined alternate auth.`);
            }

            // User selected a specific method - try only that method
            if (selectedMethod === 'hiveauth') {
              if (!adapter.broadcastWithHiveAuth) {
                throw new Error('HiveAuth not available. Please try another method.');
              }
              return await adapter.broadcastWithHiveAuth(username, ops, authority);
            } else if (selectedMethod === 'hivesigner') {
              const token = await adapter.getAccessToken(username);
              if (!token) {
                throw new Error('HiveSigner token not available. Please log in again.');
              }
              return await broadcastWithMethod('hivesigner', username, ops, auth, authority);
            }

            // Should never reach here
            throw new Error(`Unknown auth method selected: ${selectedMethod}`);
          }
        }

        // Not an auth error, or no upgrade UI available - throw original error
        throw error;
      }
    }
  }

  // FALLBACK APPROACH: For backward compatibility, use fallback chain
  // This is only used if adapter doesn't provide getLoginType
  const chain = auth?.fallbackChain ?? ['key', 'hiveauth', 'hivesigner', 'keychain', 'custom'];
  const errors: Map<string, Error> = new Map();

  for (const method of chain) {
    try {
      // Check if method is available before attempting
      let shouldSkip = false;
      let skipReason = '';

      switch (method) {
        case 'key':
          if (!adapter) {
            shouldSkip = true;
            skipReason = 'No adapter provided';
          } else {
            // Check if key is available based on authority
            let key: string | null | undefined;

            switch (authority) {
              case 'owner':
                if (adapter.getOwnerKey) {
                  key = await adapter.getOwnerKey(username);
                }
                break;
              case 'active':
                if (adapter.getActiveKey) {
                  key = await adapter.getActiveKey(username);
                }
                break;
              case 'memo':
                if (adapter.getMemoKey) {
                  key = await adapter.getMemoKey(username);
                }
                break;
              case 'posting':
              default:
                key = await adapter.getPostingKey(username);
                break;
            }

            if (!key) {
              shouldSkip = true;
              skipReason = `No ${authority} key available`;
            }
          }
          break;
        case 'hiveauth':
          if (!adapter?.broadcastWithHiveAuth) {
            shouldSkip = true;
            skipReason = 'HiveAuth not supported by adapter';
          }
          break;
        case 'hivesigner':
          if (!adapter) {
            shouldSkip = true;
            skipReason = 'No adapter provided';
          } else {
            const token = await adapter.getAccessToken(username);
            if (!token) {
              shouldSkip = true;
              skipReason = 'No access token available';
            }
          }
          break;
        case 'keychain':
          if (!adapter?.broadcastWithKeychain) {
            shouldSkip = true;
            skipReason = 'Keychain not supported by adapter';
          }
          break;
        case 'custom':
          if (!auth?.broadcast) {
            shouldSkip = true;
            skipReason = 'No custom broadcast function provided';
          }
          break;
      }

      if (shouldSkip) {
        errors.set(method, new Error(`Skipped: ${skipReason}`));
        continue;
      }

      // Method is available, attempt broadcast
      return await broadcastWithMethod(method, username, ops, auth, authority);
    } catch (error) {
      // Record actual error from failed broadcast attempt
      errors.set(method, error as Error);

      // Only continue fallback if error suggests trying another method
      if (!shouldTriggerAuthFallback(error)) {
        // If it's not an auth error, throw immediately (e.g., RC error, network error)
        throw error;
      }
    }
  }

  // FIX #2: Improved error message distinguishes between skips and real failures
  const hasRealAttempts = Array.from(errors.values()).some(
    error => !error.message.startsWith('Skipped:')
  );

  if (!hasRealAttempts) {
    // All methods were skipped (none attempted)
    const skipReasons = Array.from(errors.entries())
      .map(([method, error]) => `${method}: ${error.message}`)
      .join(', ');
    throw new Error(
      `[SDK][Broadcast] No auth methods attempted for ${username}. ${skipReasons}`
    );
  }

  // At least one method was attempted but all failed
  const errorMessages = Array.from(errors.entries())
    .map(([method, error]) => `${method}: ${error.message}`)
    .join(', ');

  throw new Error(
    `[SDK][Broadcast] All auth methods failed for ${username}. Errors: ${errorMessages}`
  );
}

/**
 * React Query mutation hook for broadcasting Hive operations.
 * Supports multiple authentication methods with automatic fallback.
 *
 * @template T - Type of the mutation payload
 * @param mutationKey - React Query mutation key for cache management
 * @param username - Hive username (required for broadcast)
 * @param operations - Function that converts payload to Hive operations
 * @param onSuccess - Success callback after broadcast completes
 * @param auth - Authentication context (supports both legacy AuthContext and new AuthContextV2)
 * @param authority - Key authority to use ('posting' | 'active' | 'owner' | 'memo'), defaults to 'posting'
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Authentication Flow:**
 *
 * 1. **With AuthContextV2 + adapter + enableFallback** (recommended for new code):
 *    - Tries auth methods in fallbackChain order
 *    - Smart fallback: only retries on auth errors, not RC/network errors
 *    - Uses platform adapter for storage, UI, and broadcasting
 *
 * 2. **With legacy AuthContext** (backward compatible):
 *    - Tries auth.broadcast() first (custom implementation)
 *    - Falls back to postingKey if available
 *    - Falls back to accessToken (HiveSigner) if available
 *    - Throws if no auth method available
 *
 * **Backward Compatibility:**
 * - All existing code using AuthContext will continue to work
 * - AuthContextV2 extends AuthContext, so it's a drop-in replacement
 * - enableFallback defaults to false if no adapter provided
 *
 * @example
 * ```typescript
 * // New pattern with platform adapter and fallback
 * const mutation = useBroadcastMutation(
 *   ['vote'],
 *   username,
 *   (payload) => [voteOperation(payload)],
 *   () => console.log('Success!'),
 *   {
 *     adapter: myAdapter,
 *     enableFallback: true,
 *     fallbackChain: ['keychain', 'key', 'hivesigner']
 *   },
 *   'posting'
 * );
 *
 * // Legacy pattern (still works)
 * const mutation = useBroadcastMutation(
 *   ['vote'],
 *   username,
 *   (payload) => [voteOperation(payload)],
 *   () => console.log('Success!'),
 *   { postingKey: 'wif-key' }
 * );
 * ```
 */
export function useBroadcastMutation<T>(
  mutationKey: MutationKey = [],
  username: string | undefined,
  operations: (payload: T) => Operation[],
  onSuccess: UseMutationOptions<unknown, Error, T>["onSuccess"] = () => {},
  auth?: AuthContextV2,
  authority: AuthorityLevel = 'posting'
) {
  return useMutation({
    onSuccess,
    mutationKey: [...mutationKey, username],
    mutationFn: async (payload: T) => {
      if (!username) {
        throw new Error(
          "[Core][Broadcast] Attempted to call broadcast API with anon user"
        );
      }

      const ops = operations(payload);

      // New: Try auth methods in fallback chain (if enabled)
      if (auth?.enableFallback !== false && auth?.adapter) {
        return broadcastWithFallback(username, ops, auth, authority);
      }

      // Legacy behavior: try methods in fixed order (backward compatible)
      if (auth?.broadcast) {
        return auth.broadcast(ops, authority);
      }

      const postingKey = auth?.postingKey;
      if (postingKey) {
        const privateKey = PrivateKey.fromString(postingKey);

        return CONFIG.hiveClient.broadcast.sendOperations(
          ops,
          privateKey
        );
      }

      const accessToken = auth?.accessToken;
      if (accessToken) {
        const client = new hs.Client({ accessToken });
        const response = await client.broadcast(ops);
        return response.result;
      }

      throw new Error(
        "[SDK][Broadcast] – cannot broadcast w/o posting key or token"
      );
    },
  });
}
