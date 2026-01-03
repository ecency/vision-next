import { useQuery } from "@tanstack/react-query";
import { getFollowCountQueryOptions } from "@ecency/sdk";

export function useGetFollowCount(username: string) {
  return useQuery(getFollowCountQueryOptions(username));
}
