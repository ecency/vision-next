import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { NotifyTypes } from "@/enums";
import { QueryIdentifiers } from "@/core/react-query";
import * as ls from "@/utils/local-storage";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { getAccessToken } from "@/utils";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";
import { getNotificationSetting } from "@/api/private-api";
import { ApiNotificationSetting } from "@/entities";

export function useUpdateNotificationsSettings() {
  const { activeUser } = useActiveAccount();
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

      const token =
        ls.get("fb-notifications-token") ?? `${activeUser.username}-web`;

      let notifyTypesToSend = notifyTypes;
      let allowsNotify = Number(isEnabled);

      if (token === `${activeUser.username}-web`) {
        try {
          const existing = await getNotificationSetting(
            activeUser.username,
            token
          );
          if (existing) {
            if (!notifyTypes.length && existing.notify_types?.length) {
              notifyTypesToSend = existing.notify_types as NotifyTypes[];
            }
            if (!isEnabled && typeof existing.allows_notify === "number") {
              allowsNotify = existing.allows_notify;
            }
          }
        } catch {
          // ignore and proceed with provided values
        }
      }

      const response = await appAxios.post<ApiNotificationSetting>(
        apiBase(`/private-api/register-device`),
        {
          code: getAccessToken(activeUser.username),
          username: activeUser.username,
          token,
          system: "web",
          allows_notify: allowsNotify,
          notify_types: notifyTypesToSend
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
