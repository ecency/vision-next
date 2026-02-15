import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import type { WithdrawRoute } from "../types";

export function getHiveAssetWithdrawalRoutesQueryOptions(
  username: string | undefined
) {
  return queryOptions({
    queryKey: ["assets", "hive", "withdrawal-routes", username],
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_withdraw_routes", [
        username,
        "outgoing",
      ]) as Promise<WithdrawRoute[]>,
  });
}
