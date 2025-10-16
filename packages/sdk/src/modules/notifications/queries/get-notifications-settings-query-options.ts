import { queryOptions } from "@tanstack/react-query";
import { ApiNotificationSetting } from "../types";
import { NotifyTypes } from "../enums";
import { CONFIG, getAccessToken } from "@/modules/core";

export function getNotificationsSettingsQueryOptions(
  activeUsername: string | undefined
) {
  return queryOptions({
    queryKey: ["notifications", "settings", activeUsername],
    queryFn: async () => {
      let token = activeUsername + "-web";
      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/detail-device",
        {
          body: JSON.stringify({
            code: getAccessToken(activeUsername!),
            username: activeUsername,
            token,
          }),
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response.json() as Promise<ApiNotificationSetting>;
    },
    enabled: !!activeUsername,
    refetchOnMount: false,
    initialData: () => {
      const wasMutedPreviously =
        localStorage.getItem("notifications") !== "true";
      return {
        status: 0,
        system: "web",
        allows_notify: 0,
        notify_types: wasMutedPreviously
          ? []
          : ([
              NotifyTypes.COMMENT,
              NotifyTypes.FOLLOW,
              NotifyTypes.MENTION,
              NotifyTypes.FAVORITES,
              NotifyTypes.BOOKMARKS,
              NotifyTypes.VOTE,
              NotifyTypes.RE_BLOG,
              NotifyTypes.TRANSFERS,
            ] as number[]),
      } as ApiNotificationSetting;
    },
  });
}
