import { useBroadcastMutation } from "@/modules/core";
import { buildClaimAccountOp } from "@/modules/operations/builders";
import type { AuthContextV2 } from "@/modules/core/types";

/**
 * Payload for claiming account creation tokens.
 */
export interface ClaimAccountPayload {
  /** Creator account claiming the token */
  creator: string;
  /** Fee for claiming (usually "0.000 HIVE" for RC-based claims) */
  fee?: string;
}

/**
 * React Query mutation hook for claiming account creation tokens.
 *
 * This mutation broadcasts a claim_account operation to claim an account
 * creation token using Resource Credits (RC). The claimed token can later
 * be used to create a new account for free using the create_claimed_account
 * operation.
 *
 * @param username - The username claiming the account token (required for broadcast)
 * @param auth - Authentication context with platform adapter and fallback configuration
 *
 * @returns React Query mutation result
 *
 * @remarks
 * **Post-Broadcast Actions:**
 * - Invalidates account cache to update pending_claimed_accounts count
 * - Updates account query data to set pending_claimed_accounts = 0 optimistically
 *
 * **Operation Details:**
 * - Uses native claim_account operation
 * - Fee: "0.000 HIVE" (uses RC instead of HIVE)
 * - Authority: Active key (required for claiming)
 *
 * **RC Requirements:**
 * - Requires sufficient Resource Credits (RC)
 * - RC amount varies based on network conditions
 * - Claiming without sufficient RC will fail
 *
 * **Use Case:**
 * - Claim tokens in advance when RC is available
 * - Create accounts later without paying HIVE fee
 * - Useful for onboarding services and apps
 *
 * @example
 * ```typescript
 * const claimMutation = useClaimAccount(username, {
 *   adapter: myAdapter,
 *   enableFallback: true,
 *   fallbackChain: ['keychain', 'key', 'hivesigner']
 * });
 *
 * // Claim account token using RC
 * claimMutation.mutate({
 *   creator: 'alice',
 *   fee: '0.000 HIVE'
 * });
 * ```
 */
export function useClaimAccount(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<ClaimAccountPayload>(
    ["accounts", "claimAccount"],
    username,
    ({ creator, fee = "0.000 HIVE" }) => [
      buildClaimAccountOp(creator, fee)
    ],
    async (_result: any, variables) => {
      // Cache invalidation
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["accounts", variables.creator],
        ]);
      }
    },
    auth,
    'active'
  );
}
