import {useHsLoginRefresh, useRecordUserActivity, useUpdateNotificationsSettings} from "@/api/mutations";
import { useNotificationsSettingsQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { Account, LoginType, User } from "@/entities";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAfterLoginTutorial } from "./use-after-login-tutorial";
import * as ls from "@/utils/local-storage";
import { ALL_NOTIFY_TYPES } from "@/enums";
import { useQueryClient } from "@tanstack/react-query";

export function useLoginInApp(username: string) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();

  const addUser = useGlobalStore((state) => state.addUser);
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const setLogin = useGlobalStore((state) => state.setLogin);

  const { mutateAsync: recordActivity } = useRecordUserActivity();
  const { mutateAsync: hsTokenRenew } = useHsLoginRefresh();
  const { mutateAsync: updateNotificationSettings } = useUpdateNotificationsSettings();
  const notificationsSettingsQuery = useNotificationsSettingsQuery();
  const refetchNotificationSettings = notificationsSettingsQuery.refetch;

  const handleTutorial = useAfterLoginTutorial(username);

  const hide = useCallback(() => {
    setLogin(false);
  }, [setLogin]);

  return useCallback(
    async (code: string, postingKey: null | undefined | string, account: Account, loginType?: LoginType) => {
      const token = await hsTokenRenew({ code });
      // get access token from code
      const user: User = {
        username: token.username,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresIn: token.expires_in,
        postingKey,
        loginType
      };

      // add / update user data
      addUser(user);

      // activate user
      setActiveUser(user.username);

      // Invalidate all queries immediately after setting active user
      // This ensures fresh data is fetched for the new account
      queryClient.invalidateQueries();

      const notifToken = ls.get("fb-notifications-token") ?? "";
      if (notifToken) {
        const { data: existingSettings } = await refetchNotificationSettings();

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

        // login activity
      await recordActivity({ty: 20});

      // Close dialog before navigation/refresh
      hide();

      // redirection based on path name
      if (pathname?.startsWith("/signup/wallet")) {
        router.push(`/@${token.username}`);
      } else if (pathname?.startsWith("/signup/email")) {
        router.push(`/@${token.username}/feed`);
      } else {
        // Refresh the page to fetch new account data
        router.refresh();
      }

      handleTutorial();
    },
    [
      addUser,
      handleTutorial,
      hide,
      hsTokenRenew,
      pathname,
      queryClient,
      recordActivity,
      router,
      setActiveUser,
      updateNotificationSettings,
      refetchNotificationSettings
    ]
  );
}
