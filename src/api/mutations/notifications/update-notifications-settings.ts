import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useGlobalStore } from "@/core/global-store";
import { NotifyTypes } from "@/enums";
import { QueryIdentifiers } from "@/core/react-query";
import * as ls from "@/utils/local-storage";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { getAccessToken } from "@/utils";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { ApiNotificationSetting } from "@/entities";

export function useUpdateNotificationsSettings() {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["notifications", "update-settings"],
    mutationFn: async ({
      notifyTypes,
      isEnabled
    }: {
      notifyTypes: NotifyTypes[];
      isEnabled: boolean;
    }) => {
      if (!activeUser?.username) {
        return undefined;
      }

      const token = ls.get("fb-notifications-token") ?? "";

      const response = await appAxios.post<ApiNotificationSetting>(
        apiBase(`/private-api/register-device`),
        {
          code: getAccessToken(activeUser.username),
          username: activeUser.username,
          token,
          system: "web",
          allows_notify: Number(isEnabled),
          notify_types: notifyTypes
        }
      );
      return response.data;
    },
    onError: (e) => error(...formatError(e)),
    onSuccess: (settings) => {
      if (!settings || !activeUser?.username) {
        return;
      }

      queryClient.setQueryData(
        [QueryIdentifiers.NOTIFICATIONS_SETTINGS, activeUser.username],
        settings
      );
    }
  });
}
