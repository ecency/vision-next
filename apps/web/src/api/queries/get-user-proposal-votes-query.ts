/**
 * Fetches ALL proposal votes for a specific user in a single query.
 * Much more efficient than querying each proposal individually.
 * Uses "by_voter_proposal" order to get all votes by a user.
 */
export { getUserProposalVotesQueryOptions as getUserProposalVotesQuery } from "@ecency/sdk";
