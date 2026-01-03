import { useQuery } from "@tanstack/react-query";
import { EcencyQueriesManager } from "@/core/react-query";
import { getAccountsQueryOptions } from "@ecency/sdk";

export function useGetAccountsQuery(usernames: string[]) {
  return useQuery(getAccountsQueryOptions(usernames));
}

export const getAccountsQuery = (usernames: string[]) =>
  EcencyQueriesManager.generateClientServerQuery(getAccountsQueryOptions(usernames));
