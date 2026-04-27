import { useQuery } from "@tanstack/react-query";
import { getPollQueryOptions } from "@ecency/sdk";
import { Entry } from "@/entities";

export function useGetPollDetailsQuery(entry?: Entry) {
  return useQuery({
    ...getPollQueryOptions(entry?.author, entry?.permlink),
    refetchOnMount: false
  });
}
