import { EcencyQueriesManager } from "@/core/react-query";
import { getSchedulesQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useSchedulesQuery() {
  const { activeUser } = useActiveAccount();

  return EcencyQueriesManager.generateClientServerQuery(
    getSchedulesQueryOptions(activeUser?.username)
  ).useClientQuery();
}
