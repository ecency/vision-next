"use client";

import {PropsWithChildren, useCallback, useEffect, useRef} from "react";
import { useGlobalStore } from "@/core/global-store";
import { isSupported } from "@firebase/messaging";
import { getFcmToken, initFirebase, listenFCM } from "@/api/firebase";
import * as ls from "@/utils/local-storage";
import { useNotificationsSettingsQuery, useNotificationUnreadCountQuery } from "@/api/queries";
import { useUpdateNotificationsSettings } from "@/api/mutations";
import usePrevious from "react-use/lib/usePrevious";
import {NotificationsWebSocket} from "@/api/notifications-ws-api";
import { NotificationSound, NotificationSoundRef } from "@/components/notification-sound";


export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const previousActiveUsr = usePrevious(activeUser);
  const notificationSoundRef = useRef<NotificationSoundRef>(null);
  const wsRef = useRef(
    new NotificationsWebSocket().withPlaySoundCallback(() => {
      notificationSoundRef.current?.playSound();
    })
  );
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
          notificationSoundRef.current?.playSound();
          notificationUnreadCountQuery.refetch();
        });
      } else {
        const hasUi = permission !== "granted";
        await wsRef.current
            .withActiveUser(activeUser)
            .setEnabledNotificationsTypes(settingsData?.notify_types ?? [])
            .setHasNotifications(true)
            .setHasUiNotifications(hasUi)
            .withCallbackOnMessage(() => notificationUnreadCountQuery.refetch())
            .connect();
      }
      setFbSupport(isFbMessagingSupported ? "granted" : "denied");
    },
    [
      activeUser,
      notificationUnreadCountQuery,
      notificationsSettingsQuery,
      setFbSupport,
      updateNotificationsSettings
    ]
  );

    useEffect(() => {
        const ws = wsRef.current;
        if (!activeUser?.username && previousActiveUsr?.username) {
            ws.disconnect();
        }
        if (activeUser && activeUser.username !== previousActiveUsr?.username) {
            ws.disconnect();

            (async () => {
                await init(activeUser.username);
            })();
        }

        return () => {
            ws.disconnect();
        };
    }, [activeUser?.username, previousActiveUsr?.username, init]);

    return (
      <>
        <NotificationSound ref={notificationSoundRef} />
        {children}
      </>
    );
}
