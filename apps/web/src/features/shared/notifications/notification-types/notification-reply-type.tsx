import { postBodySummary } from "@ecency/render-helper";
import React, { ReactElement } from "react";
import { ApiReplyNotification } from "@/entities";
import i18next from "i18next";
import { EntryLink } from "@/features/shared";

interface Props {
  sourceLink: ReactElement;
  onLinkClick?: () => void;
  afterClick: () => void;
  notification: ApiReplyNotification;
  openLinksInNewTab: boolean;
}

export function NotificationReplyType({
  sourceLink,
  onLinkClick,
  notification,
  afterClick,
  openLinksInNewTab
}: Props) {
  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <span className="item-action">{i18next.t("notifications.reply-str")}</span>
        <div className="vert-separator" />
        {!!onLinkClick ? (
          <a className="post-link" onClick={onLinkClick}>
            {notification.parent_permlink}
          </a>
        ) : (
          <EntryLink
            entry={{
              category: "category",
              author: notification.parent_author,
              permlink: notification.parent_permlink
            }}
            target={openLinksInNewTab ? "_blank" : undefined}
          >
            <div className="post-link" onClick={afterClick}>
              {notification.parent_permlink}
            </div>
          </EntryLink>
        )}
      </div>
      <div className="second-line">
        {!!onLinkClick ? (
          <div className="markdown-view mini-markdown reply-body" onClick={onLinkClick}>
            {postBodySummary(notification.body, 100)}
          </div>
        ) : (
          postBodySummary(notification.body, 100) && (
            <EntryLink
              entry={{
                category: "category",
                author: notification.author,
                permlink: notification.permlink
              }}
              target={openLinksInNewTab ? "_blank" : undefined}
            >
              <div
                className="bg-gray-100 dark:bg-gray-900 rounded-lg mt-2 p-2 text-gray-800 dark:text-gray-200"
                onClick={afterClick}
              >
                {postBodySummary(notification.body, 100)}
              </div>
            </EntryLink>
          )
        )}
      </div>
    </div>
  );
}
