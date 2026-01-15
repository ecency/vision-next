import { User } from "@/entities";
import { getAccessToken, getRefreshToken } from "@/utils";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { error } from "../../feedback";
import { useGlobalStore } from "@/core/global-store";
import { useRouter } from "next/navigation";
import { useUpdateNotificationsSettings } from "@/api/mutations";
import { getNotificationsSettingsQueryOptions } from "@ecency/sdk";
import * as ls from "@/utils/local-storage";
import { ALL_NOTIFY_TYPES } from "@/enums";

export function useUserSelect(user: User) {
  const deleteUser = useGlobalStore((state) => state.deleteUser);
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const setLogin = useGlobalStore((state) => state.setLogin);
  const queryClient = useQueryClient();
  const router = useRouter();
  const { mutateAsync: updateNotificationSettings } = useUpdateNotificationsSettings();
  const notificationsSettingsQuery = useQuery(
    getNotificationsSettingsQueryOptions(user.username, getAccessToken(user.username))
  );

  return useMutation({
    mutationKey: ["user-select", user.username],
    mutationFn: async () => {
      try {
        // Check if user still has valid token
        let token = getRefreshToken(user.username);
        if (!token) {
          deleteUser(user.username);
          throw new Error(`${i18next.t("login.error-user-not-found-cache")}`);
        }

        // Switch active user - this triggers re-render of components using activeUser
        setActiveUser(user.username);

        // Fetch notification settings for the new account
        const notifToken = ls.get("fb-notifications-token") ?? "";
        if (notifToken) {
          const { data: existingSettings } = await notificationsSettingsQuery.refetch();

          if (!existingSettings || existingSettings.allows_notify === -1) {
            await updateNotificationSettings({
              notifyTypes: [...ALL_NOTIFY_TYPES],
              isEnabled: true
            });
          } else {
            await updateNotificationSettings({
              notifyTypes: existingSettings.notify_types ?? [],
              isEnabled: Boolean(existingSettings.allows_notify)
            });
          }
        }
      } catch (e) {
        console.error(e);
        throw new Error(i18next.t("g.server-error"));
      }
    },
    onSuccess: () => {
      // Close the login dialog
      setLogin(false);

      // Invalidate all queries to refetch data for the new account
      // This will cause all active queries to refetch with the new user context
      queryClient.invalidateQueries();

      // Refresh the router to update server components
      router.refresh();
    },
    onError: (e) => error(e.message)
  });
}
