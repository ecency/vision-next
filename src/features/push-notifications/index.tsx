"use client";

import {PropsWithChildren, useCallback, useEffect, useRef} from "react";
import { useGlobalStore } from "@/core/global-store";
import { isSupported } from "@firebase/messaging";
import { getFcmToken, initFirebase, listenFCM } from "@/api/firebase";
import * as ls from "@/utils/local-storage";
import { useNotificationsSettingsQuery, useNotificationUnreadCountQuery } from "@/api/queries";
import { playNotificationSound } from "@/utils";
import { useUpdateNotificationsSettings } from "@/api/mutations";
import usePrevious from "react-use/lib/usePrevious";
import {NotificationsWebSocket} from "@/api/notifications-ws-api";


export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const previousActiveUsr = usePrevious(activeUser);
  const wsRef = useRef(new NotificationsWebSocket());
  const setFbSupport = useGlobalStore((state) => state.setFbSupport);

  const notificationsSettingsQuery = useNotificationsSettingsQuery();
  const notificationUnreadCountQuery = useNotificationUnreadCountQuery();
  const updateNotificationsSettings = useUpdateNotificationsSettings();

  const init = useCallback(
    async (username: string) => {
      let isFbMessagingSupported = await isSupported();
      initFirebase(isFbMessagingSupported);
      let token = username + "-web";
      let oldToken = ls.get("fb-notifications-token");

      let permission = "default";
      if ("Notification" in window) {
        permission = await Notification.requestPermission();
      }

      // Try FCM only if supported and granted
      if (isFbMessagingSupported && permission === "granted") {
        try {
          token = await getFcmToken();
        } catch (e) {
          isFbMessagingSupported = false;
          oldToken = null;
        }
      }

      let settingsData: typeof notificationsSettingsQuery.data | undefined;
      try {
        const result = await notificationsSettingsQuery.refetch();
        settingsData = result.data;
      } catch (e) {
        ls.remove("notifications");
      }

      if (permission === "granted" && oldToken !== token) {
        ls.set("fb-notifications-token", token);
        await updateNotificationsSettings.mutateAsync({
          notifyTypes: settingsData?.notify_types ?? [],
          isEnabled:
              settingsData?.allows_notify === -1
                  ? true
                  : Boolean(settingsData?.allows_notify)
        });
      }

      if (isFbMessagingSupported && permission === "granted") {
        listenFCM(() => {
          playNotificationSound();
          notificationUnreadCountQuery.refetch();
        });
      } else {
        await wsRef.current
            .withActiveUser(activeUser)
            .setEnabledNotificationsTypes(settingsData?.notify_types ?? [])
            .withCallbackOnMessage(() => notificationUnreadCountQuery.refetch())
            .connect();
      }
      setFbSupport(isFbMessagingSupported ? "granted" : "denied");
    },
    [
      notificationUnreadCountQuery,
      notificationsSettingsQuery,
      setFbSupport,
      updateNotificationsSettings
    ]
  );

  useEffect(() => {
    if (activeUser && activeUser?.username !== previousActiveUsr?.username) {
      (async () => {
        await init(activeUser.username);
      })();
    }
  }, [activeUser, previousActiveUsr, init]);

  return children;
}
