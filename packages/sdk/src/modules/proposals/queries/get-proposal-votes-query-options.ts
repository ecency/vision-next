import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { ProposalVote } from "../types";
import { FullAccount } from "@/modules/accounts";
import { parseAccounts } from "@/modules/accounts/utils";

// One page = array of enriched vote rows
export type ProposalVoteRow = {
  id: number;
  voter: string;
  voterAccount: FullAccount;
};

type Cursor = string; // we paginate by last voter name

/**
 * Get proposal votes with pagination and enriched voter account data
 *
 * @param proposalId - The proposal ID
 * @param voter - Starting voter for pagination
 * @param limit - Number of votes per page
 */
export function getProposalVotesInfiniteQueryOptions(
  proposalId: number,
  voter: string,
  limit: number
) {
  return infiniteQueryOptions<ProposalVoteRow[], Error, ProposalVoteRow[], (string | number)[], Cursor>({
    queryKey: ["proposals", "votes", proposalId, voter, limit],
    initialPageParam: voter as Cursor,
    refetchOnMount: true,
    staleTime: 0, // Always refetch on mount

    queryFn: async ({ pageParam }: { pageParam: Cursor }) => {
      const startParam = pageParam ?? voter;

      const response = (await CONFIG.hiveClient.call("condenser_api", "list_proposal_votes", [
        [proposalId, startParam],
        limit,
        "by_proposal_voter",
      ])) as ProposalVote[];

      const list = response
        .filter((x) => x.proposal?.proposal_id === proposalId)
        .map((x) => ({ id: x.id, voter: x.voter }));

      const rawAccounts = await CONFIG.hiveClient.database.getAccounts(list.map((l) => l.voter));
      const accounts = parseAccounts(rawAccounts);

      const page: ProposalVoteRow[] = list.map((i) => ({
        ...i,
        voterAccount: accounts.find((a) => i.voter === a.name)!,
      }));

      return page;
    },

    getNextPageParam: (lastPage: ProposalVoteRow[]): Cursor | undefined => {
      const last = lastPage?.[lastPage.length - 1];
      return last?.voter ?? undefined;
    },
  });
}
