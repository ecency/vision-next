import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { ProposalVote } from "../types";

/**
 * Fetches ALL proposal votes for a specific user in a single query.
 * Much more efficient than querying each proposal individually.
 * Uses "by_voter_proposal" order to get all votes by a user.
 */
export function getUserProposalVotesQueryOptions(voter: string) {
  return queryOptions({
    queryKey: ["proposals", "votes", "by-user", voter],
    enabled: !!voter && voter !== "",
    staleTime: 60 * 1000, // Cache for 1 minute
    queryFn: async () => {
      if (!voter || voter === "") {
        return [];
      }

      const response = (await CONFIG.hiveClient.call("database_api", "list_proposal_votes", {
        start: [voter],
        limit: 1000,
        order: "by_voter_proposal",
        order_direction: "ascending",
        status: "votable",
      })) as { proposal_votes: ProposalVote[] };

      // Filter to only this user's votes (API might return votes after this user alphabetically)
      const userVotes = (response.proposal_votes || []).filter((vote) => vote.voter === voter);

      return userVotes;
    },
  });
}
