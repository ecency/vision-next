"use client";

import "./_navbar-notifications-button.scss";
import { Button } from "@ui/button";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { useGlobalStore } from "@/core/global-store";

import { bellOffSvg, bellSvg } from "@ui/svg";
import { EcencyConfigManager } from "@/config";
import { useQuery } from "@tanstack/react-query";
import { getNotificationsUnreadCountQueryOptions } from "@ecency/sdk";
import { useClientActiveUser } from "@/api/queries";

export function NavbarNotificationsButton({ onClick }: { onClick?: () => void }) {
  const activeUser = useClientActiveUser();
  const toggleUiProp = useGlobalStore((state) => state.toggleUiProp);
  const globalNotifications = useGlobalStore((state) => state.globalNotifications);

  const { data: unread } = useQuery(getNotificationsUnreadCountQueryOptions(activeUser?.username));

  return (
    <EcencyConfigManager.Conditional
      condition={({ visionFeatures }) => visionFeatures.notifications.enabled}
    >
      <Tooltip content={i18next.t("user-nav.notifications")}>
        <div
          className="notifications"
          onClick={() => {
            toggleUiProp("notifications");
            onClick?.();
          }}
        >
          {unread > 0 && (
            <span className="notifications-badge notranslate">
              {unread.toString().length < 3 ? unread : "..."}
            </span>
          )}
          <Button icon={globalNotifications ? bellSvg : bellOffSvg} appearance="gray-link" />
        </div>
      </Tooltip>
    </EcencyConfigManager.Conditional>
  );
}
