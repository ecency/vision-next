import { useQuery } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getReblogsQueryOptions } from "@ecency/sdk";

export function useGetReblogsQuery(username?: string, limit = 200) {
  const { activeUser } = useActiveAccount();

  return useQuery(getReblogsQueryOptions(username, activeUser?.username, limit));
}
