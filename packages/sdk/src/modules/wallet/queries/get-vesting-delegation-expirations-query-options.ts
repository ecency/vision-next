import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { VestingDelegationExpiration } from "../types";

/**
 * Get expiring vesting delegations for an account.
 *
 * When a delegation is removed (set to 0 VESTS), the HP doesn't return
 * immediately — it enters a 5-day cooldown. This query fetches those
 * in-flight expirations so they can be shown alongside active delegations.
 *
 * Uses database_api.find_vesting_delegation_expirations which returns
 * vesting_shares as NAI asset objects ({amount, nai, precision}).
 *
 * @param username - The delegator account username
 */
export function getVestingDelegationExpirationsQueryOptions(username?: string) {
  return queryOptions({
    queryKey: ["wallet", "vesting-delegation-expirations", username],
    queryFn: async () => {
      if (!username) return [];
      const result = await CONFIG.hiveClient.call(
        "database_api",
        "find_vesting_delegation_expirations",
        { account: username }
      ) as { delegations: VestingDelegationExpiration[] };
      return result.delegations;
    },
    enabled: !!username,
  });
}
