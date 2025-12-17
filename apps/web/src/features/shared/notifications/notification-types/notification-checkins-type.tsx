import React, { ReactElement } from "react";
import i18next from "i18next";
import { ApiCheckinsNotification } from "@/entities";

interface Props {
  sourceLink: ReactElement;
  notification: ApiCheckinsNotification;
}

export function NotificationCheckinsType({ sourceLink, notification }: Props) {
  const count = notification.count ?? 0;

  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <span className="item-action">
          {i18next.t("notifications.checkins-title", { username: notification.source })}
        </span>
      </div>
      <div className="second-line">
        {i18next.t("notification.checkins", { count, suffix: count === 1 ? "" : "s" })}
      </div>
    </div>
  );
}
