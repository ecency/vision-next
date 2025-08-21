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

export const getAccountVoteHistoryQuery = <F>(username: string, filters: F[] = [], limit = 20) =>
  EcencyQueriesManager.generateClientServerInfiniteQuery({
    queryKey: [QueryIdentifiers.ACCOUNT_VOTES_HISTORY, username],
    queryFn: async ({ pageParam: { start } }) => {
      const response = await client.call("condenser_api", "get_account_history", [
        username,
        start,
        limit,
        ...filters
      ]);
      const result = response
        .map((historyObj: any) => ({
          ...historyObj[1].op[1],
          num: historyObj[0],
          timestamp: historyObj[1].timestamp
        }))
        .filter(
          (filtered: any) =>
            filtered.voter === username &&
            filtered.weight != 0 &&
            getDays(filtered.timestamp) <= days
        );
      const entries: Entry[] = [];

      for (const obj of result) {
        const post = await getPostQuery(obj.author, obj.permlink).fetchAndGet();
        if (post) {
          entries.push(post);
        }
      }

      return {
        lastDate: getDays(response[0][1].timestamp),
        lastItemFetched: response[0][0],
        entries
      };
    },
    initialPageParam: { start: -1 },
    getNextPageParam: (lastPage) => ({
      start: lastPage.entries.length - 1
    })
  });
