import { EcencyQueriesManager } from "@/core/react-query";
import { getNotificationsSettingsQueryOptions } from "@ecency/sdk";

export function useNotificationsSettingsQuery(activeUsername: string | undefined) {
  return EcencyQueriesManager.generateClientServerQuery(
    getNotificationsSettingsQueryOptions(activeUsername)
  ).useClientQuery();
}
