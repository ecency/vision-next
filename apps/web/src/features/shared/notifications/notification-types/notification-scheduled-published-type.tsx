import React, { ReactElement } from "react";
import i18next from "i18next";
import { ApiScheduledPublishedNotification } from "@/entities";
import { EntryLink } from "@/features/shared";
import { getNotificationEntryCategory } from "../utils";

interface Props {
  sourceLink: ReactElement;
  notification: ApiScheduledPublishedNotification;
  onLinkClick?: () => void;
  afterClick: () => void;
  openLinksInNewTab: boolean;
}

export function NotificationScheduledPublishedType({
  sourceLink,
  notification,
  onLinkClick,
  afterClick,
  openLinksInNewTab
}: Props) {
  const message = notification.title
    ? i18next.t("notification.scheduled-published-title", { title: notification.title })
    : i18next.t("notification.scheduled-published");

  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <span className="item-action">
          {i18next.t("notifications.scheduled-published-str")}
        </span>
      </div>
      {!!onLinkClick ? (
        <div
          className="second-line"
          role="button"
          tabIndex={0}
          onClick={onLinkClick}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onLinkClick?.();
            }
          }}
        >
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
          <div
            className="second-line"
            role="button"
            tabIndex={0}
            onClick={afterClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                afterClick();
              }
            }}
          >
            {message}
          </div>
        </EntryLink>
      )}
    </div>
  );
}
