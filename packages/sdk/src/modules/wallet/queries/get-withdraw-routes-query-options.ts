import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { WithdrawRoute } from "../types";

/**
 * Get power down (vesting withdrawal) routes for an account
 *
 * @param account - The account username
 */
export function getWithdrawRoutesQueryOptions(account: string) {
  return queryOptions({
    queryKey: ["wallet", "withdraw-routes", account],
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_withdraw_routes", [
        account,
        "outgoing",
      ]) as Promise<WithdrawRoute[]>,
  });
}
