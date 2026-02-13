"use client";

import { useClaimAccount, type ClaimAccountPayload } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

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
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  // Create web broadcast adapter for SDK mutations
  const adapter = createWebBroadcastAdapter();

  // Use SDK's useClaimAccount mutation with web adapter
  return useClaimAccount(username, {
    adapter,
  });
}
