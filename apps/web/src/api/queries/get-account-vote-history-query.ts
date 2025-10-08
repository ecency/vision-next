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

interface AccountVoteHistoryPage {
  lastDate: number;
  lastItemFetched: number;
  entries: Entry[];
}

interface VoteHistoryResult extends VoteOperationDetails {
  num: number;
  timestamp: string;
}

export const getAccountVoteHistoryQuery = <F>(username: string, filters: F[] = [], limit = 20) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.ACCOUNT_VOTES_HISTORY, username],
    queryFn: async ({ pageParam: { start } }: { pageParam: { start: number } }): Promise<AccountVoteHistoryPage> => {
      const response = await client.call<AccountVoteHistoryRecord[]>(
        "condenser_api",
        "get_account_history",
        [username, start, limit, ...filters]
      );

      const mappedResults: VoteHistoryResult[] = response.map(([num, historyObj]) => ({
        ...historyObj.op[1],
        num,
        timestamp: historyObj.timestamp
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
        if (post) {
          entries.push(post);
        }
      }

      const [firstHistory] = response;

      return {
        lastDate: firstHistory ? getDays(firstHistory[1].timestamp) : 0,
        lastItemFetched: firstHistory ? firstHistory[0] : start,
        entries
      };
    },
    initialPageParam: { start: -1 },
    getNextPageParam: (lastPage: AccountVoteHistoryPage) => ({
      start: lastPage.entries.length - 1
    })
  });
