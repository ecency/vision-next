import { useQuery } from "@tanstack/react-query";
import { Entry } from "@/entities";
import { getEntryActiveVotesQueryOptions } from "@ecency/sdk";

export function useGetEntryActiveVotesQuery(entry?: Entry) {
  return useQuery(getEntryActiveVotesQueryOptions(entry));
}
