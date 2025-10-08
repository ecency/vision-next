import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

export function getRcStatsQueryOptions() {
  return queryOptions({
    queryKey: ["resource-credits", "stats"],
    queryFn: async () => {
      const response = await CONFIG.hiveClient.call(
        "rc_api",
        "get_rc_stats",
        {}
      );
      return response.rc_stats;
    },
  });
}
