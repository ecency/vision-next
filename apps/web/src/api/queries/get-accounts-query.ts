import { useQuery } from "@tanstack/react-query";
import { getAccountsQueryOptions } from "@ecency/sdk";

export function useGetAccountsQuery(usernames: string[]) {
  return useQuery(getAccountsQueryOptions(usernames));
}
