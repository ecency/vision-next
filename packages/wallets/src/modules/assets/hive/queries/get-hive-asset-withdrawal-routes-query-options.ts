import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@ecency/sdk";
import { HiveWithdrawRoute } from "@/modules/assets/hive/types";

export function getHiveAssetWithdrawalRoutesQueryOptions(
  username: string | undefined,
) {
  return queryOptions({
    queryKey: ["assets", "hive", "withdrawal-routes", username],
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_withdraw_routes", [
        username,
        "outgoing",
      ]) as Promise<HiveWithdrawRoute[]>,
  });
}
