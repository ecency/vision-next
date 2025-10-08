import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { DelegatedVestingShare } from "../types";

export function getHivePowerDelegatesInfiniteQueryOptions(
  username: string,
  limit = 50
) {
  return queryOptions({
    queryKey: ["assets", "hive-power", "delegates", username],
    enabled: !!username,
    queryFn: () =>
      CONFIG.hiveClient.database.call("get_vesting_delegations", [
        username,
        "",
        limit,
      ]) as Promise<DelegatedVestingShare[]>,
  });
}
