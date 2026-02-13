import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildDelegateVestingSharesOp } from "@/modules/operations/builders";

/**
 * Payload for delegating Hive Power (vesting shares).
 */
export interface DelegateVestingSharesPayload {
  /** Account receiving HP delegation */
  delegatee: string;
  /** Amount of VESTS to delegate (e.g., "1000.000000 VESTS"). Use "0.000000 VESTS" to remove delegation. */
  vestingShares: string;
}

/**
 * React Query mutation hook for delegating Hive Power (HP).
 *
 * This mutation broadcasts a delegate_vesting_shares operation to delegate HP
 * to another account. **Requires ACTIVE authority**, not posting.
 *
 * @param username - The username delegating HP (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **IMPORTANT: Active Authority Required**
 * - Delegation operations require ACTIVE key, not posting key
 * - Make sure your auth adapter provides getActiveKey() method
 * - Keychain/HiveAuth will prompt for Active authority
 *
 * **Delegation Mechanics:**
 * - Delegated HP can be used by the delegatee for resource credits
 * - Delegatee CANNOT power down or transfer the delegated HP
 * - Delegation can be removed by setting vestingShares to "0.000000 VESTS"
 * - Removing delegation has a 5-day cooldown before HP returns to delegator
 *
 * **Post-Broadcast Actions:**
 * - Invalidates delegations list cache to show updated delegation
 * - Invalidates account data for both delegator and delegatee
 *
 * @example
 * ```typescript
 * const delegateMutation = useDelegateVestingShares(username, {
 *   adapter: {
 *     ...myAdapter,
 *     getActiveKey: async (username) => getActiveKeyFromStorage(username)
 *   },
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Delegate HP
 * delegateMutation.mutate({
 *   delegatee: 'alice',
 *   vestingShares: '1000.000000 VESTS'
 * });
 *
 * // Remove delegation
 * delegateMutation.mutate({
 *   delegatee: 'alice',
 *   vestingShares: '0.000000 VESTS'
 * });
 * ```
 */
export function useDelegateVestingShares(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<DelegateVestingSharesPayload>(
    ["wallet", "delegate-vesting-shares"],
    username,
    (payload) => [
      buildDelegateVestingSharesOp(
        username!,
        payload.delegatee,
        payload.vestingShares
      )
    ],
    async (_result, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "delegations", username],
          ["accounts", username],
          ["accounts", variables.delegatee]
        ]);
      }
    },
    auth,
    'active' // IMPORTANT: Active authority required
  );
}
