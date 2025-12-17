import React, { ReactElement } from "react";
import i18next from "i18next";
import { ApiPayoutsNotification } from "@/entities";

interface Props {
  sourceLink: ReactElement;
  notification: ApiPayoutsNotification;
}

export function NotificationPayoutsType({ sourceLink, notification }: Props) {
  const amount = notification.amount;
  const body = amount
    ? i18next.t("notification.payouts-amount", { amount })
    : i18next.t("notification.payouts");
  const message = notification.title
    ? i18next.t("notification.payouts-title", { body, title: notification.title })
    : body;

  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <span className="item-action">
          {i18next.t("notifications.payouts-title", { username: notification.source })}
        </span>
      </div>
      <div className="second-line">{message}</div>
    </div>
  );
}
