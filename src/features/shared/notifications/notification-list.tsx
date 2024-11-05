import React, { Fragment, useMemo } from "react";
import { useNotificationsQuery } from "@/api/queries";
import { LinearProgress } from "@/features/shared";
import { NotificationFilter, NotificationViewType } from "@/enums";
import { NotificationListItem } from "@/features/shared/notifications/notification-list-item";
import i18next from "i18next";
import { date2key } from "@/features/shared/notifications/utils";
import { AnimatedNotificationListItemLayout } from "@/features/shared/notifications/animated-notification-list-item-layout";

interface Props {
  filter: NotificationFilter | null;
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
  const { data, isFetching, fetchNextPage } = useNotificationsQuery(filter);

  const dataFlow = useMemo(() => data?.pages.reduce((acc, page) => [...acc, ...page], []), [data]);

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
