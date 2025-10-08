import { CONFIG } from "@ecency/sdk";
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

      const url = new URL(
        `${CONFIG.privateApiHost}/private-api/engine-account-history`
      );
      url.searchParams.set("account", username);
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("limit", limit.toString());
      url.searchParams.set("offset", (pageParam as number).toString());

      const response = await fetch(url, {
        method: "GET",
        headers: { "Content-type": "application/json" },
      });
      return (await response.json()) as HiveEngineTransaction[];
    },
  });
}
