import { NotificationsActions } from "@/features/shared/notifications/notifications-actions";
import { NotificationsStatusButtons } from "@/features/shared/notifications/notifications-status-buttons";
import { NotificationList } from "@/features/shared/notifications/notification-list";
import React, { useCallback, useMemo, useState } from "react";
import { NotificationFilter, NotificationViewType } from "@/enums";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import i18next from "i18next";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";
import { useSet } from "react-use";
import { useMarkNotificationsList } from "@/features/shared/notifications/hooks";

interface Props {
  openLinksInNewTab: boolean;
}

export function NotificationsContent({ openLinksInNewTab }: Props) {
  const [filter, setFilter] = useLocalStorage<NotificationFilter | null>(PREFIX + "_ntf_f", null);
  const [status, setStatus] = useLocalStorage<NotificationViewType>(
    PREFIX + "_ntf_s",
    NotificationViewType.ALL
  );

  const availableFilters = useMemo(() => Object.values(NotificationFilter), []);
  const activeFilter = availableFilters.includes(filter as NotificationFilter) ? filter : null;

  const [selectedNotifications, { add, remove, has, reset }] = useSet<string>(new Set());
  const [select, setSelect] = useState(false);

  const selectNotification = useCallback(
    (v: string) => (has(v) ? remove(v) : add(v)),
    [add, has, remove]
  );

  const { mutateAsync: markAsRead, isPending: isMarkingAsRead } = useMarkNotificationsList(() => {
    reset();
    setSelect(false);
  });

  return (
    <div className="notification-list">
      <div className="list-header">
        <div className="list-actions">
          <Dropdown>
            <DropdownToggle className="list-filter" withChevron={true}>
              {i18next.t(`notifications.type-${activeFilter ?? "all"}`)}
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={() => setFilter(null)} selected={activeFilter === null}>
                {i18next.t("notifications.type-all-short")}
              </DropdownItem>
              {availableFilters.map((f) => (
                <DropdownItem key={f} onClick={() => setFilter(f)} selected={activeFilter === f}>
                  {i18next.t(`notifications.type-${f}`)}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
        <NotificationsActions filter={activeFilter ?? undefined} />
      </div>

      <NotificationsStatusButtons
        currentStatus={status!}
        select={select}
        isMarkingAsRead={isMarkingAsRead}
        isSelectIcon={selectedNotifications.size > 0}
        onStatusClick={(v) => {
          setStatus(v as NotificationViewType);
        }}
        onSelectClick={() => {
          setSelect((v) => {
            if (!v) {
              reset();
            }
            return !v;
          });
        }}
        onMarkAsRead={() => markAsRead({ set: selectedNotifications })}
      />

      <NotificationList
        openLinksInNewTab={openLinksInNewTab}
        select={select}
        filter={activeFilter ?? undefined}
        currentStatus={status!}
        selectNotification={selectNotification}
      />
    </div>
  );
}
