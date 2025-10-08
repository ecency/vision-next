import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client, getAccounts } from "@/api/hive";
import { ProposalVote } from "@/entities";

export const getProposalVotesQuery = (proposalId: number, voter: string, limit: number) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, voter, limit],
    queryFn: async ({ pageParam }) => {
      const response = (await client.call("condenser_api", "list_proposal_votes", [
        [proposalId, pageParam ?? voter],
        limit,
        "by_proposal_voter"
      ])) as ProposalVote[];
      const list = response
        .filter((x: ProposalVote) => x.proposal?.proposal_id === proposalId)
        .map((x: ProposalVote) => ({ id: x.id, voter: x.voter }));
      const accounts = await getAccounts(list.map((l) => l.voter));
      return list.map((i) => ({
        ...i,
        voterAccount: accounts.find((a) => i.voter === a.name)!
      }));
    },
    initialData: { pages: [], pageParams: [] },
    initialPageParam: voter,
    refetchOnMount: true,
    getNextPageParam: (lastPage) => lastPage?.[lastPage.length - 1]?.voter ?? ""
  });
