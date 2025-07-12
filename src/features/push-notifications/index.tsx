"use client";

import { PropsWithChildren, useCallback, useEffect, useState } from "react";
import { useGlobalStore } from "@/core/global-store";
import { isSupported } from "@firebase/messaging";
import { getFcmToken, initFirebase, listenFCM } from "@/api/firebase";
import * as ls from "@/utils/local-storage";
import { useNotificationsSettingsQuery, useNotificationUnreadCountQuery, useNotificationsQuery } from "@/api/queries";
import { playNotificationSound } from "@/utils";
import { useUpdateNotificationsSettings } from "@/api/mutations";
import usePrevious from "react-use/lib/usePrevious";
import { useNotificationSSE } from "@/api/queries/notifications/notifications-sse";

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const activeUser = useGlobalStore((state) => state.activeUser);
  const previousActiveUsr = usePrevious(activeUser);

  const setFbSupport = useGlobalStore((state) => state.setFbSupport);
  const [isFbMessagingSupported, setIsFbMessagingSupported] = useState<boolean | null>(null);

  const notificationsSettingsQuery = useNotificationsSettingsQuery();
  const notificationUnreadCountQuery = useNotificationUnreadCountQuery();
  const notificationsQuery = useNotificationsQuery(null); // or provide filter if needed
  const updateNotificationsSettings = useUpdateNotificationsSettings();

  const init = useCallback(
      async (username: string) => {
        let fbSupported = await isSupported();
        initFirebase(fbSupported);
        let token = username + "-web";
        let oldToken = ls.get("fb-notifications-token");

        if ("Notification" in window) {
          const permission = await Notification.requestPermission();
          if (permission === "granted" && fbSupported) {
            try {
              token = await getFcmToken();
            } catch (e) {
              fbSupported = false;
              oldToken = null;
            }
          }

          try {
            await notificationsSettingsQuery.refetch();
          } catch (e) {
            ls.remove("notifications");
          }

          if (permission === "granted") {
            if (oldToken !== token) {
              ls.set("fb-notifications-token", token);
              await updateNotificationsSettings.mutateAsync({
                notifyTypes: notificationsSettingsQuery.data?.notify_types ?? [],
                isEnabled: notificationsSettingsQuery.data.allows_notify == -1
              });
            }

            if (fbSupported) {
              listenFCM(() => {
                playNotificationSound();
                notificationUnreadCountQuery.refetch();
                notificationsQuery.refetch(); // ✅ now works here
              });
            }
          }
        }
        setIsFbMessagingSupported(fbSupported);
        setFbSupport(fbSupported ? "granted" : "denied");
      },
      [
        notificationUnreadCountQuery,
        notificationsQuery,
        notificationsSettingsQuery,
        setFbSupport,
        updateNotificationsSettings
      ]
  );

  useEffect(() => {
    if (activeUser && activeUser?.username !== previousActiveUsr?.username) {
      init(activeUser.username);
    }
  }, [activeUser, previousActiveUsr, init]);

  useNotificationSSE(
      activeUser?.username,
      () => {
        if (isFbMessagingSupported === false) {
          playNotificationSound();
          notificationUnreadCountQuery.refetch();
          notificationsQuery.refetch();
        }
      }
  );

  return children;
}
