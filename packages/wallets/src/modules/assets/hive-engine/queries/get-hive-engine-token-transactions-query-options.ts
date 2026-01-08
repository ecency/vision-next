import { getHiveEngineTokenTransactions } from "@ecency/sdk";
import { infiniteQueryOptions } from "@tanstack/react-query";
import { HiveEngineTransaction } from "../types";

export function getHiveEngineTokenTransactionsQueryOptions(
  username: string | undefined,
  symbol: string,
  limit = 20
) {
  return infiniteQueryOptions<HiveEngineTransaction[]>({
    queryKey: ["assets", "hive-engine", symbol, "transactions", username],
    enabled: !!symbol && !!username,
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage?.length ?? 0) + limit,
    queryFn: async ({ pageParam }) => {
      if (!symbol || !username) {
        throw new Error(
          "[SDK][Wallets] – hive engine token or username missed"
        );
      }
      return getHiveEngineTokenTransactions<HiveEngineTransaction>(
        username,
        symbol,
        limit,
        pageParam as number
      );
    },
  });
}
