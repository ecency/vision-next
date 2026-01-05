import { getAllHiveEngineTokensQueryOptions } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

export const getAllHiveEngineTokensQuery = (account?: string, symbol?: string) => {
  const options = getAllHiveEngineTokensQueryOptions(account, symbol);

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};

export async function fetchAllHiveEngineTokens(account?: string, symbol?: string) {
  return getQueryClient().fetchQuery(getAllHiveEngineTokensQueryOptions(account, symbol));
}
