"use client";
import { useDelegateVestingShares } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web wrapper for SDK's useDelegateVestingShares mutation.
 * Automatically configures the web broadcast adapter and active user.
 *
 * @returns React Query mutation for delegating Hive Power (ACTIVE authority required)
 *
 * @example
 * ```typescript
 * const { mutate: delegate } = useDelegateVestingSharesMutation();
 *
 * // Delegate HP
 * delegate({
 *   delegatee: 'alice',
 *   vestingShares: '1000.000000 VESTS'
 * });
 *
 * // Remove delegation
 * delegate({
 *   delegatee: 'alice',
 *   vestingShares: '0.000000 VESTS'
 * });
 * ```
 */
export function useDelegateVestingSharesMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useDelegateVestingShares(username, { adapter });
}
