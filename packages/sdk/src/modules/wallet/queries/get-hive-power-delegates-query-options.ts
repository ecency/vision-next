import { queryOptions } from "@tanstack/react-query";
import type { DelegatedVestingShare } from "../types";
import { callRPC } from "@/modules/core/hive-tx";

export function getHivePowerDelegatesInfiniteQueryOptions(
  username: string,
  limit = 50
) {
  return queryOptions({
    queryKey: ["assets", "hive-power", "delegates", username],
    enabled: !!username,
    queryFn: () =>
      callRPC("condenser_api.get_vesting_delegations", [
        username,
        "",
        limit,
      ]) as Promise<DelegatedVestingShare[]>,
  });
}
