import { useQuery } from "@tanstack/react-query";
import { getDraftsQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useDraftsQuery() {
  const { activeUser } = useActiveAccount();

  return useQuery(getDraftsQueryOptions(activeUser?.username));
}
