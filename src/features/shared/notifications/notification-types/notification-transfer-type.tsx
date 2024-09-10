import React, { ReactElement } from "react";
import { ApiTransferNotification } from "@/entities";
import i18next from "i18next";

interface Props {
  sourceLink: ReactElement;
  notification: ApiTransferNotification;
}

export function NotificationTransferType({ sourceLink, notification }: Props) {
  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <span className="item-action">
          {i18next.t("notifications.transfer-str")}{" "}
          <span className="font-semibold text-blue-dark-sky">{notification.amount}</span>
        </span>
      </div>
      {notification.memo && (
        <div className="second-line bg-gray-100 dark:bg-gray-900 rounded-lg mt-2 p-2 md:p-3">
          <div className="transfer-memo">
            {notification.memo
              .substring(0, 120)
              .replace("https://peakd.com/", "https://ecency.com/")}
          </div>
        </div>
      )}
    </div>
  );
}
