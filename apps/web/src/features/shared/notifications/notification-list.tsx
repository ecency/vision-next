import { useActiveAccount } from "@/core/hooks";
import { NotificationFilter, NotificationViewType } from "@/enums";
import { LinearProgress } from "@/features/shared";
import { AnimatedNotificationListItemLayout } from "@/features/shared/notifications/animated-notification-list-item-layout";
import { NotificationListItem } from "@/features/shared/notifications/notification-list-item";
import { date2key } from "@/features/shared/notifications/utils";
import { getNotificationsInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { Fragment, useMemo } from "react";
import { getAccessToken } from "@/utils";

interface Props {
  filter?: NotificationFilter;
  currentStatus: NotificationViewType;
  openLinksInNewTab?: boolean;
  select?: boolean;
  selectNotification: (d: string) => void;
}

export function NotificationList({
  filter,
  currentStatus,
  openLinksInNewTab,
  select,
  selectNotification
}: Props) {
  const { activeUser } = useActiveAccount();
  const { data, isFetching, fetchNextPage } = useInfiniteQuery(
    getNotificationsInfiniteQueryOptions(
      activeUser?.username,
      getAccessToken(activeUser?.username ?? ""),
      filter
    )
  );

  const dataFlow = useMemo(
    () => data?.pages.reduce((acc, page) => [...acc, ...page], []) ?? [],
    [data]
  );

  return (
    <>
      {isFetching && dataFlow.length === 0 ? <LinearProgress /> : <></>}

      {!isFetching && dataFlow.length === 0 && (
        <div className="list-body empty-list">
          <span className="empty-text">{i18next.t("g.empty-list")}</span>
        </div>
      )}
      {dataFlow.length > 0 && (
        <div className="list-body">
          {dataFlow.map((n, i) => (
            <Fragment key={n.id}>
              {currentStatus === NotificationViewType.ALL && (
                <AnimatedNotificationListItemLayout index={i}>
                  {n.gkf && <div className="group-title">{date2key(n.gk)}</div>}
                  <NotificationListItem
                    notification={n}
                    isSelect={select}
                    setSelectedNotifications={selectNotification}
                    openLinksInNewTab={openLinksInNewTab}
                    onInViewport={(inViewport) => {
                      if (inViewport && i === dataFlow.length - 1) {
                        fetchNextPage();
                      }
                    }}
                  />
                </AnimatedNotificationListItemLayout>
              )}
              {currentStatus === NotificationViewType.READ && n.read === 1 && (
                <AnimatedNotificationListItemLayout key={n.id} index={i}>
                  {n.gkf && <div className="group-title">{date2key(n.gk)}</div>}
                  <NotificationListItem
                    notification={n}
                    isSelect={select}
                    setSelectedNotifications={selectNotification}
                    openLinksInNewTab={openLinksInNewTab}
                    onInViewport={(inViewport) => {
                      if (inViewport && i === dataFlow.length - 1) {
                        fetchNextPage();
                      }
                    }}
                  />
                </AnimatedNotificationListItemLayout>
              )}
              {currentStatus === NotificationViewType.UNREAD && n.read === 0 && (
                <AnimatedNotificationListItemLayout key={n.id} index={i}>
                  {n.gkf && <div className="group-title">{date2key(n.gk)}</div>}
                  <NotificationListItem
                    notification={n}
                    isSelect={select}
                    setSelectedNotifications={selectNotification}
                    openLinksInNewTab={openLinksInNewTab}
                    onInViewport={(inViewport) => {
                      if (inViewport && i === dataFlow.length - 1) {
                        fetchNextPage();
                      }
                    }}
                  />
                </AnimatedNotificationListItemLayout>
              )}
            </Fragment>
          ))}
        </div>
      )}
      {isFetching && dataFlow.length > 0 && <LinearProgress />}
    </>
  );
}
