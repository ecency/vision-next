import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";
import { Entry } from "@/modules/posts/types";
import { getPostQueryOptions } from "@/modules/posts/queries";

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

interface VoteHistoryResult extends VoteOperationDetails {
  num: number;
  timestamp: string;
}

export interface VoteHistoryPageParam {
  start: number;
}

export interface VoteHistoryPage {
  lastDate: number;
  lastItemFetched: number;
  entries: Entry[];
}

function isEntry(x: unknown): x is Entry {
  return (
    !!x &&
    typeof x === "object" &&
    "author" in x &&
    "permlink" in x &&
    "active_votes" in x
  );
}

/**
 * Calculate days since a date
 */
function getDays(createdDate: string): number {
  const past = new Date(createdDate);
  const now = new Date();
  const diffMs = now.getTime() - past.getTime();
  return diffMs / (1000 * 60 * 60 * 24);
}

/**
 * Get account vote history with entries
 *
 * @param username - Account name to get vote history for
 * @param limit - Number of history items per page (default: 20)
 * @param filters - Additional filters to pass to get_account_history
 * @param dayLimit - Only include votes from last N days (default: 7)
 */
export function getAccountVoteHistoryInfiniteQueryOptions<F>(
  username: string,
  options?: {
    limit?: number;
    filters?: F[];
    dayLimit?: number;
  }
) {
  const { limit = 20, filters = [], dayLimit = 7.0 } = options ?? {};

  return infiniteQueryOptions<
    VoteHistoryPage,
    Error,
    VoteHistoryPage,
    (string | number)[],
    VoteHistoryPageParam
  >({
    queryKey: QueryKeys.accounts.voteHistory(username, limit),
    initialPageParam: { start: -1 },

    queryFn: async ({ pageParam }: { pageParam: VoteHistoryPageParam }) => {
      const { start } = pageParam;

      const response = (await CONFIG.hiveClient.call(
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
          getDays(filtered.timestamp) <= dayLimit
      );

      const entries: Entry[] = [];
      for (const obj of result) {
        const post = await CONFIG.queryClient.fetchQuery(
          getPostQueryOptions(obj.author, obj.permlink)
        );
        if (isEntry(post)) entries.push(post);
      }

      const [firstHistory] = response;

      return {
        lastDate: firstHistory ? getDays(firstHistory[1].timestamp) : 0,
        lastItemFetched: firstHistory ? firstHistory[0] : start,
        entries,
      };
    },

    getNextPageParam: (lastPage: VoteHistoryPage): VoteHistoryPageParam => ({
      start: lastPage.lastItemFetched,
    }),
  });
}
