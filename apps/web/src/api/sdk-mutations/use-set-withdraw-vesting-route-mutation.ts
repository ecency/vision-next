"use client";
import { useSetWithdrawVestingRoute } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web wrapper for SDK's useSetWithdrawVestingRoute mutation.
 * Automatically configures the web broadcast adapter and active user.
 *
 * @returns React Query mutation for setting withdraw vesting route (ACTIVE authority required)
 *
 * @example
 * ```typescript
 * const { mutate: setRoute } = useSetWithdrawVestingRouteMutation();
 *
 * // Route 50% of power down to another account (auto vest)
 * setRoute({
 *   toAccount: 'alice',
 *   percent: 5000, // 50% (already scaled)
 *   autoVest: true
 * });
 * ```
 */
export function useSetWithdrawVestingRouteMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useSetWithdrawVestingRoute(username, { adapter });
}
