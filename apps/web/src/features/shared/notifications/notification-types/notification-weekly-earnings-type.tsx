import React, { ReactElement } from "react";
import i18next from "i18next";
import { ApiWeeklyEarningsNotification } from "@/entities";

interface Props {
  sourceLink: ReactElement;
  notification: ApiWeeklyEarningsNotification;
}

export function NotificationWeeklyEarningsType({ sourceLink, notification }: Props) {
  const totalUsd = notification.total_usd ?? "0";
  const authorUsd = notification.author_usd ?? "0";
  const curationUsd = notification.curation_usd ?? "0";

  const hasBreakdown = notification.author_usd && notification.curation_usd;
  const message = hasBreakdown
    ? i18next.t("notification.weekly-earnings", {
        total: totalUsd,
        author: authorUsd,
        curation: curationUsd
      })
    : i18next.t("notification.weekly-earnings-short", { total: totalUsd });

  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <span className="item-action">
          {i18next.t("notifications.weekly-earnings-title", { username: notification.source })}
        </span>
      </div>
      <div className="second-line">{message}</div>
    </div>
  );
}
