import {
  useMutation,
  type MutationKey,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { Operation, PrivateKey, TransactionConfirmation } from "@hiveio/dhive";
import { CONFIG } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { shouldTriggerAuthFallback } from "@/modules/core/errors";
import hs from "hivesigner";

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
 * This function implements smart fallback logic:
 * - Tries each auth method in the fallback chain order
 * - Only continues to next method if error is auth-related (missing authority, token expired)
 * - Stops immediately for non-auth errors (RC exhaustion, network errors, validation errors)
 * - Collects all errors and provides detailed failure message
 *
 * @example
 * ```typescript
 * // Typical usage in useBroadcastMutation
 * const auth: AuthContextV2 = {
 *   adapter: myAdapter,
 *   fallbackChain: ['keychain', 'key', 'hivesigner'],
 *   enableFallback: true
 * };
 *
 * try {
 *   const result = await broadcastWithFallback(username, ops, auth, 'active');
 *   console.log('Transaction ID:', result.id);
 * } catch (error) {
 *   console.error('All methods failed:', error);
 * }
 * ```
 */
async function broadcastWithFallback(
  username: string,
  ops: Operation[],
  auth?: AuthContextV2,
  authority: 'posting' | 'active' | 'owner' | 'memo' = 'posting'
): Promise<TransactionConfirmation> {
  // FIX #1: Include 'custom' in default fallback chain so auth.broadcast is not bypassed
  const chain = auth?.fallbackChain ?? ['key', 'hiveauth', 'hivesigner', 'keychain', 'custom'];
  const errors: Map<string, Error> = new Map();
  const adapter = auth?.adapter;

  for (const method of chain) {
    try {
      switch (method) {
        case 'key': {
          // Track skip reason: No adapter provided
          if (!adapter) {
            errors.set(method, new Error('Skipped: No adapter provided'));
            break;
          }

          // Choose key based on authority
          let key: string | null | undefined;
          if (authority === 'active' && adapter.getActiveKey) {
            key = await adapter.getActiveKey(username);
          } else if (authority === 'posting') {
            key = await adapter.getPostingKey(username);
          }

          // Track skip reason: No key available
          if (!key) {
            errors.set(method, new Error(`Skipped: No ${authority} key available`));
            break;
          }
          // Attempt broadcast with key
          const privateKey = PrivateKey.fromString(key);
          return await CONFIG.hiveClient.broadcast.sendOperations(ops, privateKey);
        }

        case 'hiveauth': {
          // Track skip reason: HiveAuth not supported by adapter
          if (!adapter?.broadcastWithHiveAuth) {
            errors.set(method, new Error('Skipped: HiveAuth not supported by adapter'));
            break;
          }
          // Attempt broadcast with HiveAuth
          return await adapter.broadcastWithHiveAuth(username, ops, authority);
        }

        case 'hivesigner': {
          // Track skip reason: No adapter provided
          if (!adapter) {
            errors.set(method, new Error('Skipped: No adapter provided'));
            break;
          }
          const token = await adapter.getAccessToken(username);
          // Track skip reason: No access token available
          if (!token) {
            errors.set(method, new Error('Skipped: No access token available'));
            break;
          }
          // Attempt broadcast with HiveSigner
          const client = new hs.Client({ accessToken: token });
          const response = await client.broadcast(ops);
          return response.result;
        }

        case 'keychain': {
          // Track skip reason: Keychain not supported by adapter
          if (!adapter?.broadcastWithKeychain) {
            errors.set(method, new Error('Skipped: Keychain not supported by adapter'));
            break;
          }
          // Attempt broadcast with Keychain
          return await adapter.broadcastWithKeychain(username, ops, authority);
        }

        case 'custom': {
          // Track skip reason: No custom broadcast function provided
          if (!auth?.broadcast) {
            errors.set(method, new Error('Skipped: No custom broadcast function provided'));
            break;
          }
          // Attempt broadcast with custom function
          return (await auth.broadcast(ops, authority)) as TransactionConfirmation;
        }
      }
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
  authority: 'posting' | 'active' | 'owner' | 'memo' = 'posting'
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
