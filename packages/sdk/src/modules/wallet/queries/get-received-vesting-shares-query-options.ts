import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { ReceivedVestingShare } from "../types/received-vesting-share";

export function getReceivedVestingSharesQueryOptions(username: string) {
  return queryOptions({
    queryKey: ["wallet", "received-vesting-shares", username],
    queryFn: async () => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/received-vesting/${username}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch received vesting shares: ${response.status}`);
      }

      const data = (await response.json()) as { list: ReceivedVestingShare[] };
      return data.list;
    },
  });
}
