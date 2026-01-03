import React, { ReactElement } from "react";
import i18next from "i18next";
import { ApiPayoutsNotification } from "@/entities";
import { EntryLink } from "@/features/shared";
import { getNotificationEntryCategory } from "../utils";

interface Props {
  sourceLink: ReactElement;
  notification: ApiPayoutsNotification;
  onLinkClick?: () => void;
  afterClick: () => void;
  openLinksInNewTab: boolean;
}

export function NotificationPayoutsType({
  sourceLink,
  notification,
  onLinkClick,
  afterClick,
  openLinksInNewTab
}: Props) {
  const amount = notification.amount;
  const body = amount
    ? i18next.t("notification.payouts-amount", { amount })
    : i18next.t("notification.payouts");
  const message = notification.title
    ? i18next.t("notification.payouts-title", { body, title: notification.title })
    : body;
  const username = notification.author;

  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <span className="item-action">
          {i18next.t("notifications.payouts-title", { username })}
        </span>
      </div>
      {!!onLinkClick ? (
        <div className="second-line" onClick={onLinkClick}>
          {message}
        </div>
      ) : (
        <EntryLink
          entry={{
            category: getNotificationEntryCategory(notification) ?? "created",
            author: notification.author,
            permlink: notification.permlink
          }}
          target={openLinksInNewTab ? "_blank" : undefined}
        >
          <div className="second-line" onClick={afterClick}>
            {message}
          </div>
        </EntryLink>
      )}
    </div>
  );
}
