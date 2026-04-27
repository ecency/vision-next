import { useQuery } from "@tanstack/react-query";
import { getPollQueryOptions, type Poll } from "@ecency/sdk";
import { Entry } from "@/entities";

/** @deprecated Use `Poll` from `@ecency/sdk` directly */
export type GetPollDetailsQueryResponse = Poll;

export function useGetPollDetailsQuery(entry?: Entry) {
  return useQuery({
    ...getPollQueryOptions(entry?.author, entry?.permlink),
    refetchOnMount: false
  });
}
