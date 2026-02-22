"use client";

import { useClaimAccount, type ClaimAccountPayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific claim account mutation hook using SDK.
 *
 * Wraps the SDK's useClaimAccount mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates account cache and updates pending_claimed_accounts
 *
 * @returns Mutation result with claim account function from SDK
 *
 * @example
 * ```typescript
 * const ClaimAccountButton = ({ account }) => {
 *   const { mutateAsync: claimAccount, isPending } = useClaimAccountMutation();
 *
 *   const handleClaim = async () => {
 *     try {
 *       await claimAccount({
 *         creator: account.name,
 *         fee: '0.000 HIVE' // Use RC instead of HIVE
 *       });
 *       // Success! Account token claimed
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <button onClick={handleClaim} disabled={isPending}>Claim Account</button>;
 * };
 * ```
 */
export function useClaimAccountMutation() {
  const username = useActiveUsername();

  // Get shared web broadcast adapter singleton for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's useClaimAccount mutation with web adapter
  return useClaimAccount(username, {
    adapter,
  });
}
