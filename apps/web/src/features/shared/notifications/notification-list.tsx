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
  const hasNextPageRef = useRef(hasNextPage);
  const isFetchingNextPageRef = useRef(isFetchingNextPage);
  const fetchNextPageRef = useRef(fetchNextPage);

  hasNextPageRef.current = hasNextPage;
  isFetchingNextPageRef.current = isFetchingNextPage;
  fetchNextPageRef.current = fetchNextPage;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasNextPageRef.current &&
          !isFetchingNextPageRef.current
        ) {
          fetchNextPageRef.current();
        }
      },
      { rootMargin: "0px 0px 200px 0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const dataFlow = useMemo(
    () => data?.pages.reduce((acc, page) => [...acc, ...page], []) ?? [],
    [data]
  );

  // pages.length === 0 means we only have initialData (empty shell from SDK),
  // real data hasn't been fetched yet. Don't show "Nothing here" in this state.
  const hasFetchedOnce = (data?.pages.length ?? 0) > 0;

  const filteredData = useMemo(() => {
    if (currentStatus === NotificationViewType.READ) {
      return dataFlow.filter((n) => n.read === 1);
    }
    if (currentStatus === NotificationViewType.UNREAD) {
      return dataFlow.filter((n) => n.read === 0);
    }
    return dataFlow;
  }, [dataFlow, currentStatus]);

  const isLoading = isFetching || !hasFetchedOnce;

  return (
    <>
      {isLoading && dataFlow.length === 0 ? <LinearProgress /> : <></>}

      <div className={`list-body${filteredData.length === 0 && !isLoading ? " empty-list" : ""}`}>
        {!isLoading && filteredData.length === 0 && !hasNextPage && (
          <span className="empty-text">{i18next.t("g.empty-list")}</span>
        )}
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
      {isLoading && dataFlow.length > 0 && <LinearProgress />}
    </>
  );
}
