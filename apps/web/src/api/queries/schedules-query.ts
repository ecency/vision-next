import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getSchedules } from "@/api/private-api";

export function useSchedulesQuery() {
  const { activeUser } = useActiveAccount();

  return useQuery({
    queryKey: [QueryIdentifiers.SCHEDULES, activeUser?.username],
    queryFn: () => getSchedules(activeUser!.username),
    enabled: !!activeUser
  });
}
