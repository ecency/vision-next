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
 *   const result = await broadcastWithFallback(username, ops, auth);
 *   console.log('Transaction ID:', result.id);
 * } catch (error) {
 *   console.error('All methods failed:', error);
 * }
 * ```
 */
async function broadcastWithFallback(
  username: string,
  ops: Operation[],
  auth?: AuthContextV2
): Promise<TransactionConfirmation> {
  const chain = auth?.fallbackChain ?? ['key', 'hiveauth', 'hivesigner', 'keychain'];
  const errors: Map<string, Error> = new Map();
  const adapter = auth?.adapter;

  for (const method of chain) {
    try {
      switch (method) {
        case 'key': {
          if (!adapter) break;
          const key = await adapter.getPostingKey(username);
          if (key) {
            const privateKey = PrivateKey.fromString(key);
            return await CONFIG.hiveClient.broadcast.sendOperations(ops, privateKey);
          }
          break;
        }

        case 'hiveauth': {
          if (adapter?.broadcastWithHiveAuth) {
            return await adapter.broadcastWithHiveAuth(username, ops, 'posting');
          }
          break;
        }

        case 'hivesigner': {
          if (!adapter) break;
          const token = await adapter.getAccessToken(username);
          if (token) {
            const client = new hs.Client({ accessToken: token });
            const response = await client.broadcast(ops);
            return response.result;
          }
          break;
        }

        case 'keychain': {
          if (adapter?.broadcastWithKeychain) {
            return await adapter.broadcastWithKeychain(username, ops, 'Posting');
          }
          break;
        }

        case 'custom': {
          if (auth?.broadcast) {
            return (await auth.broadcast(ops, 'posting')) as TransactionConfirmation;
          }
          break;
        }
      }
    } catch (error) {
      errors.set(method, error as Error);

      // Only continue fallback if error suggests trying another method
      if (!shouldTriggerAuthFallback(error)) {
        // If it's not an auth error, throw immediately (e.g., RC error, network error)
        throw error;
      }
    }
  }

  // All methods failed with auth errors
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
 *   }
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
  auth?: AuthContextV2
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
        return broadcastWithFallback(username, ops, auth);
      }

      // Legacy behavior: try methods in fixed order (backward compatible)
      if (auth?.broadcast) {
        return auth.broadcast(ops, "posting");
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
