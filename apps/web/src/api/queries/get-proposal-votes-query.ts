import { EcencyQueriesManager } from "@/core/react-query";
import { getProposalVotesInfiniteQueryOptions, ProposalVoteRow } from "@ecency/sdk";

export type { ProposalVoteRow };

export const getProposalVotesQuery = (proposalId: number, voter: string, limit: number) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery(
    getProposalVotesInfiniteQueryOptions(proposalId, voter, limit)
  );
