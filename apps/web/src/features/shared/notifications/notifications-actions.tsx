import { useMarkNotifications, useUpdateNotificationsSettings } from "@/api/mutations";
import { hiveNotifySetLastRead } from "@/api/operations";
import { useClientActiveUser } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { NotificationFilter, NotifyTypes } from "@/enums";
import { FormControl, Tooltip } from "@/features/ui";
import {
  getNotificationsInfiniteQueryOptions,
  getNotificationsSettingsQueryOptions,
  getNotificationsUnreadCountQueryOptions
} from "@ecency/sdk";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Dropdown,
  DropdownItem,
  DropdownItemHeader,
  DropdownMenu,
  DropdownToggle
} from "@ui/dropdown";
import { checkSvg, settingsSvg, syncSvg } from "@ui/svg";
import { classNameObject } from "@ui/util";
import { default as i18n, default as i18next } from "i18next";
import { useEffect } from "react";
import { useDebounce, useMap, useMount } from "react-use";

interface Props {
  filter?: NotificationFilter;
}

export function NotificationsActions({ filter }: Props) {
  const activeUser = useClientActiveUser();
  const isMobile = useGlobalStore((state) => state.isMobile);

  const [settings, { set: setSettingItem }] = useMap<Record<NotifyTypes, boolean>>({
    [NotifyTypes.COMMENT]: false,
    [NotifyTypes.FOLLOW]: false,
    [NotifyTypes.MENTION]: false,
    [NotifyTypes.FAVORITES]: false,
    [NotifyTypes.BOOKMARKS]: false,
    [NotifyTypes.VOTE]: false,
    [NotifyTypes.RE_BLOG]: false,
    [NotifyTypes.TRANSFERS]: false,
    [NotifyTypes.ALLOW_NOTIFY]: false
  });

  const { data: notificationSettings } = useQuery(
    getNotificationsSettingsQueryOptions(activeUser?.username)
  );
  const {
    data: unread,
    refetch: refetchUnread,
    isLoading: isUnreadLoading
  } = useQuery(getNotificationsUnreadCountQueryOptions(activeUser?.username));
  const { refetch: refetchData, isLoading: isDataLoading } = useInfiniteQuery(
    getNotificationsInfiniteQueryOptions(filter)
  );

  const markNotifications = useMarkNotifications();
  const updateSettings = useUpdateNotificationsSettings();

  useMount(() => refetchData());

  useEffect(() => {
    if (notificationSettings) {
      Array.from(Object.keys(settings) as NotifyTypes[]).forEach((type) =>
        setSettingItem(type, false)
      );
      notificationSettings.notify_types?.map((type) => setSettingItem(type, true));
    }
  }, [notificationSettings, setSettingItem]);

  useDebounce(
    () => {
      const enabledTypes = Array.from(Object.keys(settings) as NotifyTypes[]).filter(
        (type) => settings[type]
      );
      const isSame =
        enabledTypes.every((et) => notificationSettings?.notify_types?.every((nt) => et !== nt)) &&
        enabledTypes.length === notificationSettings?.notify_types?.length;
      if (!isSame && activeUser) {
        updateSettings.mutateAsync({
          notifyTypes: enabledTypes,
          isEnabled: enabledTypes.length > 0
        });
      }
    },
    500,
    [settings, activeUser]
  );

  const getNotificationSettingsItem = (title: string, type: NotifyTypes) => (
    <div onClick={(e) => e.stopPropagation()}>
      <FormControl
        label={i18next.t(title)}
        type="checkbox"
        isToggle={true}
        checked={settings[type]}
        onChange={() => setSettingItem(type, !settings[type])}
      />
    </div>
  );

  const markAsRead = () => {
    markNotifications.mutateAsync({ id: undefined });
    hiveNotifySetLastRead(activeUser!.username).then();
  };

  const refresh = () => {
    refetchUnread();
    refetchData();
  };

  return (
    <div className="list-actions">
      {!isMobile ? (
        <>
          <Tooltip content={i18next.t("notifications.mark-all-read")}>
            <span
              className={classNameObject({
                "list-action": true,
                disabled: markNotifications.isPending || unread === 0
              })}
              onClick={() => markAsRead()}
            >
              {checkSvg}
            </span>
          </Tooltip>
          <Tooltip content={i18next.t("notifications.refresh")}>
            <span
              className={classNameObject({
                "list-action": true,
                disabled: isDataLoading || isUnreadLoading
              })}
              onClick={() => refresh()}
            >
              {syncSvg}
            </span>
          </Tooltip>
        </>
      ) : (
        <></>
      )}

      <Dropdown>
        <DropdownToggle>
          <span
            className={classNameObject({
              "list-action": true,
              disabled: updateSettings.isPending
            })}
          >
            {settingsSvg}
          </span>
        </DropdownToggle>
        <DropdownMenu align="right">
          <DropdownItemHeader>{i18next.t(`notifications.settings`)}</DropdownItemHeader>
          {isMobile && (
            <DropdownItem onClick={() => markAsRead()}>
              <Tooltip content={i18n.t(`notifications.mark-all-read`)}>
                <div className="list-actions">
                  <Tooltip content={i18next.t("notifications.mark-all-read")}>
                    <span
                      className={classNameObject({
                        "list-action": true,
                        disabled: markNotifications.isPending || unread === 0
                      })}
                    >
                      {checkSvg}
                    </span>
                  </Tooltip>
                </div>
              </Tooltip>
            </DropdownItem>
          )}
          {isMobile && (
            <DropdownItem onClick={() => refresh()}>
              <Tooltip content={i18next.t(`notifications.refresh`)}>
                <div className="list-actions">
                  <Tooltip content={i18next.t("notifications.refresh")}>
                    <span
                      className={classNameObject({
                        "list-action": true,
                        disabled: isDataLoading || isUnreadLoading
                      })}
                    >
                      {syncSvg}
                    </span>
                  </Tooltip>
                </div>
              </Tooltip>
            </DropdownItem>
          )}
          <DropdownItem>
            {getNotificationSettingsItem(i18next.t(`notifications.type-rvotes`), NotifyTypes.VOTE)}
          </DropdownItem>
          <DropdownItem>
            {getNotificationSettingsItem(
              i18next.t(`notifications.type-replies`),
              NotifyTypes.COMMENT
            )}
          </DropdownItem>
          <DropdownItem>
            {getNotificationSettingsItem(
              i18next.t(`notifications.type-mentions`),
              NotifyTypes.MENTION
            )}
          </DropdownItem>
          <DropdownItem>
            {getNotificationSettingsItem(
              i18next.t(`notifications.type-nfavorites`),
              NotifyTypes.FAVORITES
            )}
          </DropdownItem>
          <DropdownItem>
            {getNotificationSettingsItem(
              i18next.t(`notifications.type-nbookmarks`),
              NotifyTypes.BOOKMARKS
            )}
          </DropdownItem>
          <DropdownItem>
            {getNotificationSettingsItem(
              i18next.t(`notifications.type-reblogs`),
              NotifyTypes.RE_BLOG
            )}
          </DropdownItem>
          <DropdownItem>
            {getNotificationSettingsItem(
              i18next.t(`notifications.type-follows`),
              NotifyTypes.FOLLOW
            )}
          </DropdownItem>
          <DropdownItem>
            {getNotificationSettingsItem(
              i18next.t(`notifications.type-transfers`),
              NotifyTypes.TRANSFERS
            )}
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </div>
  );
}
