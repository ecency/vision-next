import { useMutation } from "@tanstack/react-query";
import { Operation, PrivateKey, TransactionConfirmation } from "@hiveio/dhive";
import { CONFIG } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildTransferOp } from "@/modules/operations/builders";
import { shouldTriggerAuthFallback } from "@/modules/core/errors";
import hs from "hivesigner";

/**
 * Payload for transferring tokens.
 */
export interface TransferPayload {
  /** Recipient account */
  to: string;
  /** Amount with asset symbol (e.g., "1.000 HIVE", "5.000 HBD") */
  amount: string;
  /** Transfer memo */
  memo: string;
}

/**
 * Attempts to broadcast transfer operations using multiple auth methods in fallback chain.
 * Transfer operations require ACTIVE authority, not posting authority.
 *
 * @param username - Hive username to broadcast for
 * @param ops - Operations to broadcast
 * @param auth - AuthContextV2 with adapter and fallback configuration
 * @returns Transaction confirmation from the blockchain
 * @throws Error if all auth methods fail or if a non-auth error occurs
 */
async function broadcastTransferWithFallback(
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
          const key = await adapter.getActiveKey?.(username);
          if (key) {
            const privateKey = PrivateKey.fromString(key);
            return await CONFIG.hiveClient.broadcast.sendOperations(ops, privateKey);
          }
          break;
        }

        case 'hiveauth': {
          if (adapter?.broadcastWithHiveAuth) {
            return await adapter.broadcastWithHiveAuth(username, ops, 'active');
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
            return await adapter.broadcastWithKeychain(username, ops, 'active');
          }
          break;
        }

        case 'custom': {
          if (auth?.broadcast) {
            return (await auth.broadcast(ops, 'active')) as TransactionConfirmation;
          }
          break;
        }
      }
    } catch (error) {
      errors.set(method, error as Error);

      // Only continue fallback if error suggests trying another method
      if (!shouldTriggerAuthFallback(error)) {
        throw error;
      }
    }
  }

  // All methods failed with auth errors
  const errorMessages = Array.from(errors.entries())
    .map(([method, error]) => `${method}: ${error.message}`)
    .join(', ');

  throw new Error(
    `[SDK][Transfer] All auth methods failed for ${username}. Errors: ${errorMessages}`
  );
}

/**
 * React Query mutation hook for transferring tokens.
 *
 * This mutation broadcasts a transfer operation to send HIVE, HBD, or other
 * Hive-based tokens to another account. **Requires ACTIVE authority**, not posting.
 *
 * @param username - The username sending the transfer (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **IMPORTANT: Active Authority Required**
 * - Transfer operations require ACTIVE key, not posting key
 * - Make sure your auth adapter provides getActiveKey() method
 * - Keychain/HiveAuth will prompt for Active authority
 *
 * **Post-Broadcast Actions:**
 * - Records activity (type 140) if adapter.recordActivity is available
 * - Invalidates wallet balance caches to show updated balances
 * - Invalidates transaction history
 *
 * **Supported Assets:**
 * - HIVE: "1.000 HIVE"
 * - HBD: "5.000 HBD"
 * - Amount must include exactly 3 decimal places
 *
 * @example
 * ```typescript
 * const transferMutation = useTransfer(username, {
 *   adapter: {
 *     ...myAdapter,
 *     getActiveKey: async (username) => getActiveKeyFromStorage(username)
 *   },
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Transfer HIVE
 * transferMutation.mutate({
 *   to: 'alice',
 *   amount: '10.000 HIVE',
 *   memo: 'Thanks for the post!'
 * });
 *
 * // Transfer HBD
 * transferMutation.mutate({
 *   to: 'bob',
 *   amount: '5.000 HBD',
 *   memo: ''
 * });
 * ```
 */
export function useTransfer(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useMutation({
    mutationKey: ["wallet", "transfer", username],
    mutationFn: async (payload: TransferPayload) => {
      if (!username) {
        throw new Error(
          "[SDK][Transfer] Attempted to call transfer API with anon user"
        );
      }

      const ops = [buildTransferOp(username, payload.to, payload.amount, payload.memo)];

      // Try auth methods in fallback chain
      if (auth?.enableFallback !== false && auth?.adapter) {
        return broadcastTransferWithFallback(username, ops, auth);
      }

      // Legacy behavior: try methods in fixed order
      if (auth?.broadcast) {
        return auth.broadcast(ops, "active");
      }

      // Try active key from adapter
      if (auth?.adapter?.getActiveKey) {
        const activeKey = await auth.adapter.getActiveKey(username);
        if (activeKey) {
          const privateKey = PrivateKey.fromString(activeKey);
          return CONFIG.hiveClient.broadcast.sendOperations(ops, privateKey);
        }
      }

      const accessToken = auth?.accessToken;
      if (accessToken) {
        const client = new hs.Client({ accessToken });
        const response = await client.broadcast(ops);
        return response.result;
      }

      throw new Error(
        "[SDK][Transfer] – cannot broadcast transfer w/o active key or token"
      );
    },
    onSuccess: async (result: any, variables) => {
      // Activity tracking
      if (auth?.adapter?.recordActivity && result?.block_num && result?.id) {
        await auth.adapter.recordActivity(140, result.block_num, result.id);
      }

      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    }
  });
}
