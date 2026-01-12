import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { Proposal } from "../types";

/**
 * Get a single proposal by ID
 */
export function getProposalQueryOptions(id: number) {
  return queryOptions({
    queryKey: ["proposals", "proposal", id],
    queryFn: async () => {
      const r = await CONFIG.hiveClient.call("condenser_api", "find_proposals", [[id]]);
      const proposal = r[0];

      // Determine proposal status based on dates
      if (new Date(proposal.start_date) < new Date() && new Date(proposal.end_date) >= new Date()) {
        proposal.status = "active";
      } else if (new Date(proposal.end_date) < new Date()) {
        proposal.status = "expired";
      } else {
        proposal.status = "inactive";
      }

      return proposal as Proposal;
    },
  });
}
