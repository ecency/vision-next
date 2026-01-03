import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { Proposal } from "../types";

/**
 * Get all proposals, sorted with expired proposals at the end
 */
export function getProposalsQueryOptions() {
  return queryOptions({
    queryKey: ["proposals", "list"],
    queryFn: async () => {
      const response = (await CONFIG.hiveClient.call("database_api", "list_proposals", {
        start: [-1],
        limit: 500,
        order: "by_total_votes",
        order_direction: "descending",
        status: "all",
      })) as { proposals: Proposal[] };

      const proposals = response.proposals;
      const expired = proposals.filter((x) => x.status === "expired");
      const others = proposals.filter((x) => x.status !== "expired");

      return [...others, ...expired];
    },
  });
}
