"use client";

import { NotificationsWebSocket } from "@/api/notifications-ws-api";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useGlobalStore } from "@/core/global-store";
import { NotifyTypes } from "@/enums";
import {
  getNotificationsInfiniteQueryOptions,
  getNotificationsSettingsQueryOptions,
  getNotificationsUnreadCountQueryOptions
} from "@ecency/sdk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { usePrevious } from "react-use";
import { getAccessToken } from "@/utils";
import * as ls from "@/utils/local-storage";

export function NotificationHandler() {
  const nws = useRef(new NotificationsWebSocket());

  const { activeUser } = useActiveAccount();
  const uiNotifications = useGlobalStore((state) => state.uiNotifications);
  const globalNotifications = useGlobalStore((state) => state.globalNotifications);
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);
  const fbSupport = useGlobalStore((state) => state.fbSupport);

  const previousActiveUser = usePrevious(activeUser);
  const accessToken = getAccessToken(activeUser?.username ?? "");

  const notificationUnreadCountQuery = useQuery(
    getNotificationsUnreadCountQueryOptions(activeUser?.username, accessToken)
  );
  const notificationsQuery = useInfiniteQuery(
    getNotificationsInfiniteQueryOptions(activeUser?.username, accessToken)
  );
  const notificationsSettingsQuery = useQuery(
    getNotificationsSettingsQueryOptions(
      activeUser?.username,
      accessToken,
      ls.get("notifications") !== "true"
    )
  );

  useEffect(() => {
    nws.current
      .withActiveUser(activeUser)
      .withCallbackOnMessage(() => {
        notificationsSettingsQuery.refetch();
        notificationUnreadCountQuery.refetch();
        notificationsQuery.refetch();
      })
      .withToggleUi(toggleUIProp)
      .setHasUiNotifications(uiNotifications)
      .setHasNotifications(globalNotifications)
      .setEnabledNotificationsTypes(
        (notificationsSettingsQuery.data?.notify_types as NotifyTypes[]) || []
      );
  }, [
    activeUser,
    globalNotifications,
    notificationUnreadCountQuery,
    notificationsQuery,
    notificationsSettingsQuery,
    toggleUIProp,
    uiNotifications
  ]);

  useEffect(() => {
    nws.current.setEnabledNotificationsTypes(
      (notificationsSettingsQuery.data?.notify_types as NotifyTypes[]) || []
    );
  }, [notificationsSettingsQuery.data, nws]);

  useEffect(() => {
    if (fbSupport === "denied" && activeUser) {
      nws.current.disconnect();
      nws.current.withActiveUser(activeUser).connect();
    }

    if (!previousActiveUser && activeUser && activeUser.username) {
      nws.current.disconnect();
      if (fbSupport === "denied") {
        nws.current.withActiveUser(activeUser).connect();
      }
    }

    if (activeUser?.username !== previousActiveUser?.username) {
      nws.current.disconnect();
      if (fbSupport === "denied") {
        nws.current.withActiveUser(activeUser).connect();
      }
    }
  }, [activeUser, fbSupport, previousActiveUser]);

  return <></>;
}
