"use client";
import { useDelegateVestingShares } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

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
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useDelegateVestingShares(activeUser?.username, { adapter });
}
