import { useActiveAccount } from "@/core/hooks";
import { NotificationFilter, NotificationViewType } from "@/enums";
import { LinearProgress } from "@/features/shared";
import { AnimatedNotificationListItemLayout } from "@/features/shared/notifications/animated-notification-list-item-layout";
import { NotificationListItem } from "@/features/shared/notifications/notification-list-item";
import { date2key } from "@/features/shared/notifications/utils";
import { getNotificationsInfiniteQueryOptions } from "@ecency/sdk";
import { useInfiniteQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useEffect, useMemo, useRef } from "react";
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
  const { data, isFetching, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery(
    getNotificationsInfiniteQueryOptions(
      activeUser?.username,
      getAccessToken(activeUser?.username ?? ""),
      filter
    )
  );

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "0px 0px 200px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const dataFlow = useMemo(
    () => data?.pages.reduce((acc, page) => [...acc, ...page], []) ?? [],
    [data]
  );

  const filteredData = useMemo(() => {
    if (currentStatus === NotificationViewType.READ) {
      return dataFlow.filter((n) => n.read === 1);
    }
    if (currentStatus === NotificationViewType.UNREAD) {
      return dataFlow.filter((n) => n.read === 0);
    }
    return dataFlow;
  }, [dataFlow, currentStatus]);

  return (
    <>
      {isFetching && dataFlow.length === 0 ? <LinearProgress /> : <></>}

      {!isFetching && filteredData.length === 0 && (
        <div className="list-body empty-list">
          <span className="empty-text">{i18next.t("g.empty-list")}</span>
        </div>
      )}
      {filteredData.length > 0 && (
        <div className="list-body">
          {filteredData.map((n, i) => (
            <AnimatedNotificationListItemLayout key={n.id} index={i}>
              {n.gkf && <div className="group-title">{date2key(n.gk)}</div>}
              <NotificationListItem
                notification={n}
                isSelect={select}
                setSelectedNotifications={selectNotification}
                openLinksInNewTab={openLinksInNewTab}
              />
            </AnimatedNotificationListItemLayout>
          ))}
          <div ref={sentinelRef} style={{ height: 1 }} />
        </div>
      )}
      {isFetching && dataFlow.length > 0 && <LinearProgress />}
    </>
  );
}
