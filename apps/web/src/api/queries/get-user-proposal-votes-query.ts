import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";
import { ProposalVote } from "@/entities";

/**
 * Fetches ALL proposal votes for a specific user in a single query.
 * Much more efficient than querying each proposal individually.
 * Uses "by_voter_proposal" order to get all votes by a user.
 */
export const getUserProposalVotesQuery = (voter: string) =>
  EcencyQueriesManager.generateClientServerQuery<ProposalVote[]>({
    queryKey: [QueryIdentifiers.PROPOSAL_VOTES, "by_user", voter],
    enabled: !!voter && voter !== "", // Only run if voter is specified
    staleTime: 60 * 1000, // Cache for 1 minute
    queryFn: async () => {
      if (!voter || voter === "") {
        return [];
      }

      const response = (await client.call("database_api", "list_proposal_votes", {
        start: [voter],
        limit: 1000,
        order: "by_voter_proposal",
        order_direction: "ascending",
        status: "votable"
      })) as { proposal_votes: ProposalVote[] };

      // Filter to only this user's votes (API might return votes after this user alphabetically)
      const userVotes = (response.proposal_votes || []).filter(
        (vote) => vote.voter === voter
      );

      return userVotes;
    }
  });
