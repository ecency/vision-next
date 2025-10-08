import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { client } from "@/api/hive";
import dayjs from "@/utils/dayjs";
import { getPostQuery } from "@/api/queries/get-post-query";
import { Entry } from "@/entities";

const days = 7.0;
const getDays = (createdDate: string): number => {
  const past = dayjs(createdDate);
  const now = dayjs();
  return now.diff(past, "day", true);
};

interface VoteOperationDetails {
  voter: string;
  author: string;
  permlink: string;
  weight: number;
}

interface AccountVoteHistoryItem {
  timestamp: string;
  op: [string, VoteOperationDetails];
}

type AccountVoteHistoryRecord = [number, AccountVoteHistoryItem];

type PageParam = { start: number };

interface Page {
  lastDate: number;
  lastItemFetched: number;
  entries: Entry[];
}

interface VoteHistoryResult extends VoteOperationDetails {
  num: number;
  timestamp: string;
}

export const getAccountVoteHistoryQuery = <F>(
    username: string,
    filters: F[] = [],
    limit = 20
) =>
    EcencyQueriesManager.generateClientServerInfiniteQuery<Page, PageParam>({
      queryKey: [QueryIdentifiers.ACCOUNT_VOTES_HISTORY, username],
      initialPageParam: { start: -1 },
      initialData: { pages: [], pageParams: [] },

      // annotate pageParam; remove generic from client.call
      queryFn: async ({ pageParam }: { pageParam: PageParam }): Promise<Page> => {
        const { start } = pageParam;

        const response = (await client.call(
            "condenser_api",
            "get_account_history",
            [username, start, limit, ...filters]
        )) as AccountVoteHistoryRecord[];

        const mappedResults: VoteHistoryResult[] = response.map(([num, historyObj]) => ({
          ...historyObj.op[1],
          num,
          timestamp: historyObj.timestamp,
        }));

        const result = mappedResults.filter(
            (filtered) =>
                filtered.voter === username &&
                filtered.weight !== 0 &&
                getDays(filtered.timestamp) <= days
        );

        const entries: Entry[] = [];
        for (const obj of result) {
          const post = await getPostQuery(obj.author, obj.permlink).fetchAndGet();
          if (post) entries.push(post);
        }

        const [firstHistory] = response;

        return {
          lastDate: firstHistory ? getDays(firstHistory[1].timestamp) : 0,
          lastItemFetched: firstHistory ? firstHistory[0] : start,
          entries,
        };
      },

      // Use the chain index we just recorded to paginate (safer than entries.length - 1)
      getNextPageParam: (lastPage: Page): PageParam => ({
        start: lastPage.lastItemFetched,
      }),
    });
