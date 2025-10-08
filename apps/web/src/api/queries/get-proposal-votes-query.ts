import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client, getAccounts } from "@/api/hive";
import { ProposalVote } from "@/entities";

// One page = array of enriched vote rows
type ProposalVoteRow = {
    id: number;
    voter: string;
    voterAccount: any; // replace `any` with your Account type if you have one
};
type Cursor = string; // we paginate by last voter name

export const getProposalVotesQuery = (
    proposalId: number,
    voter: string,
    limit: number
) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery<
        ProposalVoteRow[],
        Cursor
    >({
        queryKey: [QueryIdentifiers.PROPOSAL_VOTES, proposalId, voter, limit],
        initialData: { pages: [], pageParams: [] },
        initialPageParam: voter as Cursor,
        refetchOnMount: true,

        // 👇 annotate pageParam to avoid implicit-any
        queryFn: async ({ pageParam }: { pageParam: Cursor }) => {
            const response = (await client.call(
                "condenser_api",
                "list_proposal_votes",
                [[proposalId, pageParam ?? voter], limit, "by_proposal_voter"]
            )) as ProposalVote[];

            const list = response
                .filter((x) => x.proposal?.proposal_id === proposalId)
                .map((x) => ({ id: x.id, voter: x.voter }));

            const accounts = await getAccounts(list.map((l) => l.voter));

            const page: ProposalVoteRow[] = list.map((i) => ({
                ...i,
                voterAccount: accounts.find((a) => i.voter === a.name)!,
            }));
            return page;
        },

        getNextPageParam: (
            lastPage: ProposalVoteRow[]
        ): Cursor | undefined => {
            const last = lastPage?.[lastPage.length - 1];
            return last?.voter ?? undefined;
        },
    });
