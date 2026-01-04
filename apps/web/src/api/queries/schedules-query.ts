import { useQuery } from "@tanstack/react-query";
import { getSchedulesQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useSchedulesQuery() {
  const { activeUser } = useActiveAccount();

  return useQuery(getSchedulesQueryOptions(activeUser?.username));
}
