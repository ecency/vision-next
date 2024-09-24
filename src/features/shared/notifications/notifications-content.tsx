import { NotificationsActions } from "@/features/shared/notifications/notifications-actions";
import { NotificationsStatusButtons } from "@/features/shared/notifications/notifications-status-buttons";
import { NotificationList } from "@/features/shared/notifications/notification-list";
import React, { useState } from "react";
import { NotificationFilter, NotificationViewType } from "@/enums";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "@ui/dropdown";
import i18next from "i18next";
import useLocalStorage from "react-use/lib/useLocalStorage";
import { PREFIX } from "@/utils/local-storage";

interface Props {
  openLinksInNewTab: boolean;
}

export function NotificationsContent({ openLinksInNewTab }: Props) {
  const [filter, setFilter] = useLocalStorage<NotificationFilter | null>(PREFIX + "_ntf_f", null);
  // TODO: SHOULD BE AN ARRAY??
  const [selectedNotifications, setSelectedNotifications] = useState<string>();
  const [status, setStatus] = useLocalStorage<NotificationViewType>(
    PREFIX + "_ntf_s",
    NotificationViewType.ALL
  );
  const [select, setSelect] = useState(false);
  const [isSelectIcon, setIsSelectIcon] = useState(false);

  return (
    <div className="notification-list">
      <div className="list-header">
        <div className="list-actions">
          <Dropdown>
            <DropdownToggle className="list-filter" withChevron={true}>
              {i18next.t(`notifications.type-${filter ?? "all"}`)}
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem onClick={() => setFilter(null)}>
                {i18next.t("notifications.type-all-short")}
              </DropdownItem>
              {Object.values(NotificationFilter).map((f) => (
                <DropdownItem key={f} onClick={() => setFilter(f)}>
                  {i18next.t(`notifications.type-${f}`)}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </div>
        <NotificationsActions filter={filter ?? null} />
      </div>

      <NotificationsStatusButtons
        currentStatus={status!}
        select={select}
        isSelectIcon={isSelectIcon}
        onStatusClick={(v) => {
          setStatus(v as NotificationViewType);
          setSelectedNotifications(undefined);
        }}
        onSelectClick={() => {
          setSelect((v) => {
            if (!v) {
              setIsSelectIcon(false);
            }
            return !v;
          });
        }}
      />

      <NotificationList
        openLinksInNewTab={openLinksInNewTab}
        select={select}
        filter={filter ?? null}
        currentStatus={status!}
        setSelectedNotifications={setSelectedNotifications}
      />
    </div>
  );
}
