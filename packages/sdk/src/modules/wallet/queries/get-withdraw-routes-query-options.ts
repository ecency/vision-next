import { queryOptions } from "@tanstack/react-query";
import { WithdrawRoute } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

/**
 * Get power down (vesting withdrawal) routes for an account
 *
 * @param account - The account username
 */
export function getWithdrawRoutesQueryOptions(account: string) {
  return queryOptions({
    queryKey: ["wallet", "withdraw-routes", account],
    queryFn: () =>
      callRPC("condenser_api.get_withdraw_routes", [
        account,
        "outgoing",
      ]) as Promise<WithdrawRoute[]>,
  });
}
