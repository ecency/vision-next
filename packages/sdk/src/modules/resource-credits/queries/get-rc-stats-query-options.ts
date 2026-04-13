import { queryOptions } from "@tanstack/react-query";
import { callRPC } from "@/modules/core/hive-tx";

export function getRcStatsQueryOptions() {
  return queryOptions({
    queryKey: ["resource-credits", "stats"],
    queryFn: async () => {
      const response = await callRPC("rc_api.get_rc_stats", {});
      return response.rc_stats;
    },
  });
}
