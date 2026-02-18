import { useBroadcastMutation } from "@/modules/core/mutations";
import { QueryKeys } from "@/modules/core";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildSetWithdrawVestingRouteOp } from "@/modules/operations/builders";

/**
 * Payload for setting withdraw vesting route.
 */
export interface SetWithdrawVestingRoutePayload {
  /** Account receiving withdrawn vesting */
  toAccount: string;
  /** Percentage to route (0-10000, where 10000 = 100%). Already scaled. */
  percent: number;
  /** Auto convert to vesting (power up) */
  autoVest: boolean;
}

/**
 * React Query mutation hook for setting withdraw vesting route.
 *
 * This mutation broadcasts a set_withdraw_vesting_route operation to configure
 * where withdrawn VESTS (power down) are sent. **Requires ACTIVE authority**, not posting.
 *
 * @param username - The username setting withdraw route (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **IMPORTANT: Active Authority Required**
 * - Withdraw route operations require ACTIVE key, not posting key
 * - Make sure your auth adapter provides getActiveKey() method
 * - Keychain/HiveAuth will prompt for Active authority
 *
 * **Withdraw Route Mechanics:**
 * - Routes a percentage of power down (withdraw_vesting) to another account
 * - Percent must be between 0-10000 (where 10000 = 100%)
 * - Multiple routes can be set, total cannot exceed 100%
 * - autoVest=true converts withdrawn VESTS to HP in destination account
 * - autoVest=false converts withdrawn VESTS to liquid HIVE
 *
 * **Post-Broadcast Actions:**
 * - Invalidates withdraw routes cache to show updated routes
 * - Invalidates account data for both accounts
 *
 * @example
 * ```typescript
 * const setRouteMutation = useSetWithdrawVestingRoute(username, {
 *   adapter: {
 *     ...myAdapter,
 *     getActiveKey: async (username) => getActiveKeyFromStorage(username)
 *   },
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Route 50% of power down to another account (auto vest)
 * setRouteMutation.mutate({
 *   toAccount: 'alice',
 *   percent: 5000, // 50% (already scaled)
 *   autoVest: true
 * });
 *
 * // Route 100% of power down to another account (liquid HIVE)
 * setRouteMutation.mutate({
 *   toAccount: 'bob',
 *   percent: 10000, // 100% (already scaled)
 *   autoVest: false
 * });
 * ```
 */
export function useSetWithdrawVestingRoute(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<SetWithdrawVestingRoutePayload>(
    ["wallet", "set-withdraw-vesting-route"],
    username,
    (payload) => [
      buildSetWithdrawVestingRouteOp(
        username!,
        payload.toAccount,
        payload.percent,
        payload.autoVest
      )
    ],
    async (_result, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          QueryKeys.wallet.withdrawRoutes(username!),
          QueryKeys.accounts.full(username),
          QueryKeys.accounts.full(variables.toAccount)
        ]);
      }
    },
    auth,
    'active' // IMPORTANT: Active authority required
  );
}
