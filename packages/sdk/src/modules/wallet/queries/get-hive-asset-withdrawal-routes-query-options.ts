import { queryOptions } from "@tanstack/react-query";
import type { WithdrawRoute } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

export function getHiveAssetWithdrawalRoutesQueryOptions(
  username: string | undefined
) {
  return queryOptions({
    queryKey: ["assets", "hive", "withdrawal-routes", username],
    queryFn: () =>
      callRPC("condenser_api.get_withdraw_routes", [
        username,
        "outgoing",
      ]) as Promise<WithdrawRoute[]>,
    enabled: !!username,
  });
}
