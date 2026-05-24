"use client";

import { getFcmToken, initFirebase, listenFCM } from "@/api/firebase";
import { useUpdateNotificationsSettings } from "@/api/mutations";
import { NotificationsWebSocket } from "@/api/notifications-ws-api";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { ALL_NOTIFY_TYPES, NotifyTypes } from "@/enums";
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
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);
  const uiNotifications = useGlobalStore((state) => state.uiNotifications);

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
  // Latest settings snapshot for the FCM callback, which is registered once
  // inside init() and would otherwise read a stale closure (ignoring later type
  // toggles or the global allows_notify switch).
  const notificationSettingsRef = useRef(notificationsSettingsQuery.data);
  notificationSettingsRef.current = notificationsSettingsQuery.data;

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
          const settings = notificationSettingsRef.current;
          const notifyType = wsRef.current.getNotificationType(payload.data?.type ?? "");
          const typeAllowed =
            typeof notifyType === "number" &&
            settings?.notify_types &&
            settings.notify_types.length > 0
              ? settings.notify_types.includes(notifyType)
              : true;
          // Mirror the websocket gating: respect the global switch and the
          // latest per-type set (empty/unset → allow all).
          if (Boolean(settings?.allows_notify) && typeAllowed) {
            playNotificationSound();
          }
          notificationUnreadCountQuery.refetch();
        });
      } else {
        await wsRef.current
          .withActiveUser(activeUser)
          .setEnabledNotificationsTypes(settingsData?.notify_types ?? [])
          .setHasNotifications(Boolean(settingsData?.allows_notify))
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
    } else {
      // Logged out: clear the active user so a pending reconnect timer can't
      // revive the socket, then close it.
      ws.withActiveUser(null).disconnect();
    }

    return () => {
      ws.disconnect();
    };
  }, [activeUser?.username]);

  // Keep the live socket's gating in sync when the user changes notification
  // settings WITHOUT reconnecting. The lifecycle effect above only runs on
  // username change, so without this a toggled type — or the global on/off —
  // wouldn't take effect until reload/account switch. onMessageReceive reads
  // these fields on each incoming message, so updating them in place is enough.
  useEffect(() => {
    wsRef.current
      .setEnabledNotificationsTypes(
        (notificationsSettingsQuery.data?.notify_types as NotifyTypes[]) ?? []
      )
      .setHasNotifications(Boolean(notificationsSettingsQuery.data?.allows_notify));
  }, [notificationsSettingsQuery.data]);

  // Keep the panel-toggle wiring and the live panel-open state on the socket
  // instance. This provider's instance owns the live socket on the websocket
  // path, so without this an OS notification's onclick would be a no-op — and a
  // stale open-state would close the panel instead of opening it.
  useEffect(() => {
    wsRef.current.withToggleUi(toggleUiProp).setHasUiNotifications(uiNotifications);
  }, [toggleUiProp, uiNotifications]);

  return children;
}
