import { useBroadcastMutation } from "@/modules/core/mutations";
import type { AuthContextV2 } from "@/modules/core/types";
import { buildTransferOp } from "@/modules/operations/builders";

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
 * React Query mutation hook for transferring tokens.
 *
 * This mutation broadcasts a transfer operation to send HIVE or HBD
 * to another account. **Requires ACTIVE authority**.
 *
 * Uses `useBroadcastMutation` with the smart auth strategy:
 * - Adapter determines login type and dispatches to appropriate method
 * - If active key not available (common on web), triggers `showAuthUpgradeUI`
 * - Supports keychain, hivesigner, hiveauth, and direct key signing
 *
 * @param username - The username sending the transfer (required for broadcast)
 * @param auth - Authentication context with platform adapter
 *
 * @returns React Query mutation result
 */
export function useTransfer(
  username: string | undefined,
  auth?: AuthContextV2
) {
  return useBroadcastMutation<TransferPayload>(
    ["wallet", "transfer"],
    username,
    (payload) => [
      buildTransferOp(username!, payload.to, payload.amount, payload.memo)
    ],
    async (_result, variables) => {
      if (auth?.adapter?.invalidateQueries) {
        await auth.adapter.invalidateQueries([
          ["wallet", "balances", username],
          ["wallet", "balances", variables.to],
          ["wallet", "transactions", username]
        ]);
      }
    },
    auth,
    'active'
  );
}
