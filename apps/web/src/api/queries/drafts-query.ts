import { EcencyQueriesManager } from "@/core/react-query";
import { getDraftsQueryOptions } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useDraftsQuery() {
  const { activeUser } = useActiveAccount();

  return EcencyQueriesManager.generateClientServerQuery(
    getDraftsQueryOptions(activeUser?.username)
  ).useClientQuery();
}
