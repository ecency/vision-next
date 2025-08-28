"use client";

import {PropsWithChildren, useCallback, useEffect, useRef} from "react";
import { useGlobalStore } from "@/core/global-store";
import { isSupported, MessagePayload } from "@firebase/messaging";
import { getFcmToken, initFirebase, listenFCM } from "@/api/firebase";
import * as ls from "@/utils/local-storage";
import { useNotificationsSettingsQuery, useNotificationUnreadCountQuery } from "@/api/queries";
import { playNotificationSound } from "@/utils";
import { useUpdateNotificationsSettings } from "@/api/mutations";
import usePrevious from "react-use/lib/usePrevious";
import {NotificationsWebSocket} from "@/api/notifications-ws-api";
import {ALL_NOTIFY_TYPES} from "@/enums";


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

      const isMissingSettings = settingsData?.allows_notify === -1;
      const tokenChanged = permission === "granted" && oldToken !== token;

      if (isMissingSettings || tokenChanged) {
        ls.set("fb-notifications-token", token);
        settingsData = await updateNotificationsSettings.mutateAsync({
          notifyTypes: isMissingSettings
            ? [...ALL_NOTIFY_TYPES]
            : settingsData?.notify_types ?? [],
          isEnabled: isMissingSettings
            ? true
            : Boolean(settingsData?.allows_notify)
        });
      }

      if (isFbMessagingSupported && permission === "granted") {
        listenFCM((payload: MessagePayload) => {
          const notifyType = wsRef.current.getNotificationType(
            payload.data?.type ?? ""
          );
          const allowed =
            typeof notifyType === "number" && notificationsSettingsQuery.data?.notify_types
              ? notificationsSettingsQuery.data.notify_types.includes(notifyType)
              : true;
          if (allowed) {
            playNotificationSound();
          }
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

    return children;
}
