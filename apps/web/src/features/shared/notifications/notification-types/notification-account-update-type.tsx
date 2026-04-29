import React, { ReactElement } from "react";
import i18next from "i18next";
import { ApiAccountUpdateNotification } from "@/entities";

interface Props {
  sourceLink: ReactElement;
  notification: ApiAccountUpdateNotification;
}

function pickKey(notification: ApiAccountUpdateNotification): {
  key: string;
  values: Record<string, string>;
} {
  const keys = notification.keys_changed ?? [];
  const granted = notification.accounts_granted ?? [];
  const accounts = granted.map((g) => `@${g.account}`).join(", ");

  if (keys.includes("owner")) return { key: "notifications.account-update-owner-key", values: {} };
  if (keys.includes("active")) return { key: "notifications.account-update-active-key", values: {} };
  if (keys.includes("posting"))
    return { key: "notifications.account-update-posting-key", values: {} };

  if (granted.length) {
    const authorities = new Set(granted.map((g) => g.authority));
    if (authorities.has("owner"))
      return { key: "notifications.account-update-owner-authority", values: { accounts } };
    if (authorities.has("active"))
      return { key: "notifications.account-update-active-authority", values: { accounts } };
    return { key: "notifications.account-update-posting-authority", values: { accounts } };
  }

  return { key: "notifications.account-update-str", values: {} };
}

export function NotificationAccountUpdateType({ sourceLink, notification }: Props) {
  const { key, values } = pickKey(notification);
  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <span className="item-action">{i18next.t(key, values)}</span>
      </div>
    </div>
  );
}
