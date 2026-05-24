"use client";

import { getFcmToken, initFirebase, listenFCM } from "@/api/firebase";
import { useUpdateNotificationsSettings } from "@/api/mutations";
import { NotificationsWebSocket } from "@/api/notifications-ws-api";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { ALL_NOTIFY_TYPES } from "@/enums";
import { getAccessToken, playNotificationSound } from "@/utils";
import * as ls from "@/utils/local-storage";
import {
  getNotificationsSettingsQueryOptions,
  getNotificationsUnreadCountQueryOptions
} from "@ecency/sdk";
import { isSupported, MessagePayload } from "@firebase/messaging";
import { useQuery } from "@tanstack/react-query";
import { PropsWithChildren, useCallback, useEffect, useRef } from "react";

export function PushNotificationsProvider({ children }: PropsWithChildren) {
  const { activeUser } = useActiveAccount();
  const wsRef = useRef(new NotificationsWebSocket());
  const setFbSupport = useGlobalStore((state) => state.setFbSupport);

  // Safely check if notifications were muted previously
  // Returns true if muted, false if not muted or if localStorage is unavailable
  const wasMutedPreviously = ls.get("notifications") !== "true";

  const notificationsSettingsQuery = useQuery(
    getNotificationsSettingsQueryOptions(
      activeUser?.username,
      getAccessToken(activeUser?.username ?? ""),
      wasMutedPreviously
    )
  );
  const notificationUnreadCountQuery = useQuery(
    getNotificationsUnreadCountQueryOptions(
      activeUser?.username,
      getAccessToken(activeUser?.username ?? "")
    )
  );
  const updateNotificationsSettings = useUpdateNotificationsSettings();

  const init = useCallback(
    async (username: string) => {
      let isFbMessagingSupported = await isSupported();
      initFirebase(isFbMessagingSupported);
      let token = username + "-web";
      let oldToken = ls.get("fb-notifications-token");

      let permission = "default";
      if ("Notification" in window) {
        permission = Notification.permission;

        if (
          permission === "default" &&
          typeof Notification.requestPermission === "function"
        ) {
          permission = await Notification.requestPermission();
        }
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
            : (settingsData?.notify_types ?? []),
          isEnabled: isMissingSettings ? true : Boolean(settingsData?.allows_notify)
        });
      }

      if (isFbMessagingSupported && permission === "granted") {
        listenFCM((payload: MessagePayload) => {
          const notifyType = wsRef.current.getNotificationType(payload.data?.type ?? "");
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

  // Keep the latest `init` in a ref so the connection lifecycle effect below
  // does NOT depend on `init`'s identity. `init` is recreated on every
  // react-query refetch (its deps include the query result objects), so if the
  // effect depended on it, the 60s unread-count poll — and even the socket's
  // own on-message refetch — would re-run the effect, fire its cleanup, and
  // tear the socket down with no reconnect for the same user. Browsers without
  // FCM (e.g. Brave) rely on this socket staying alive, so this keeps it up.
  const initRef = useRef(init);
  initRef.current = init;

  useEffect(() => {
    const ws = wsRef.current;
    const username = activeUser?.username;

    // Runs only when the username actually changes (login / logout / switch).
    // The cleanup disconnects the previous user's socket before we connect the
    // next one, and on unmount.
    if (username) {
      (async () => {
        await initRef.current(username);
      })();
    }

    return () => {
      ws.disconnect();
    };
  }, [activeUser?.username]);

  return children;
}
