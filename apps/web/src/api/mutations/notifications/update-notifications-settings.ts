"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { NotifyTypes } from "@/enums";
import { QueryIdentifiers } from "@/core/react-query";
import * as ls from "@/utils/local-storage";
import { error } from "@/features/shared";
import { formatError } from "@/api/operations";
import { getNotificationSetting, saveNotificationSetting } from "@ecency/sdk";
import { getAccessToken } from "@/utils";

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
            getAccessToken(activeUser.username),
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

      return saveNotificationSetting(
        getAccessToken(activeUser.username),
        activeUser.username,
        "web",
        allowsNotify,
        notifyTypesToSend as number[],
        token
      );
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
