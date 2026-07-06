import { queryOptions } from "@tanstack/react-query";
import { ApiNotificationSetting } from "../types";
import { ALL_NOTIFY_TYPES } from "../enums";
import { CONFIG, QueryKeys } from "@/modules/core";

export function getNotificationsSettingsQueryOptions(
  activeUsername: string | undefined,
  code: string | undefined,
  initialMuted?: boolean
) {
  return queryOptions({
    queryKey: QueryKeys.notifications.settings(activeUsername),
    queryFn: async () => {
      let token = activeUsername + "-web";
      if (!code) {
        throw new Error("Missing access token");
      }
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/detail-device",
        {
          body: JSON.stringify({
            code,
            username: activeUsername,
            token,
          }),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch notification settings: ${response.status}`);
      }
      return response.json() as Promise<ApiNotificationSetting>;
    },
    enabled: !!activeUsername && !!code,
    refetchOnMount: false,
    initialData: () => {
      return {
        status: 0,
        system: "web",
        allows_notify: 0,
        notify_types: initialMuted ? [] : ([...ALL_NOTIFY_TYPES] as number[]),
      } as ApiNotificationSetting;
    },
  });
}
