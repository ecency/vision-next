import { useQuery } from "@tanstack/react-query";
import { getNotificationsSettingsQueryOptions } from "@ecency/sdk";

export function useNotificationsSettingsQuery(activeUsername: string | undefined) {
  return useQuery(getNotificationsSettingsQueryOptions(activeUsername));
}
