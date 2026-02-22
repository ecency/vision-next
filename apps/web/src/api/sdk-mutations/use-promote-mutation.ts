"use client";

import { usePromote, type PromotePayload } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

/**
 * Web-specific promote mutation hook using SDK.
 *
 * Wraps the SDK's usePromote mutation with web-specific logic:
 * - Integrates with web global store for current user
 * - Uses web broadcast adapter for auth (HiveSigner, Keychain, HiveAuth, private keys)
 * - Automatically invalidates promoted posts, points balance, and post cache after promotion
 *
 * @returns Mutation result with promote function from SDK
 *
 * @example
 * ```typescript
 * const PromoteButton = ({ author, permlink }) => {
 *   const { mutateAsync: promote, isPending } = usePromoteMutation();
 *
 *   const handlePromote = async () => {
 *     try {
 *       await promote({
 *         author,
 *         permlink,
 *         duration: 7 // Promote for 7 days
 *       });
 *       // Success! Cache updated automatically by SDK
 *     } catch (error) {
 *       // Error already shown by adapter
 *     }
 *   };
 *
 *   return <button onClick={handlePromote} disabled={isPending}>Promote</button>;
 * };
 * ```
 */
export function usePromoteMutation() {
  const username = useActiveUsername();

  // Create web broadcast adapter for SDK mutations
  const adapter = getWebBroadcastAdapter();

  // Use SDK's usePromote mutation with web adapter
  return usePromote(username, {
    adapter,
  });
}
