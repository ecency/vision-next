import { CONFIG } from "@/modules/core/config";
import { queryOptions } from "@tanstack/react-query";
import type { ReceivedVestingShare } from "../types";
import { parseAsset } from "@/modules/core/utils";

export function getHivePowerDelegatingsQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["assets", "hive-power", "delegatings", username],
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/received-vesting/${username}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return (await response.json()).list as ReceivedVestingShare[];
    },
    select: (data) =>
      data.sort(
        (a, b) =>
          parseAsset(b.vesting_shares).amount -
          parseAsset(a.vesting_shares).amount
      ),
  });
}
