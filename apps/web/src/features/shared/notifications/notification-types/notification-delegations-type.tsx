import React, { ReactElement } from "react";
import { ApiDelegationsNotification } from "@/entities";
import i18next from "i18next";
import { formattedNumber, rcFormatter, vestsToHp } from "@/utils";
import { DEFAULT_DYNAMIC_PROPS, getDynamicPropsQuery } from "@/api/queries";

interface Props {
  sourceLink: ReactElement;
  notification: ApiDelegationsNotification;
}

export function NotificationDelegationsType({ sourceLink, notification }: Props) {
  const { data } = getDynamicPropsQuery().useClientQuery();

  return (
    <div className="item-content">
      <div className="first-line">
        {sourceLink}
        <span className="item-action">
          {i18next.t("notifications.delegations-str")}{" "}
          <span className="transfer-amount">
            {notification.amount.includes("VESTS")
              ? formattedNumber(
                  vestsToHp(
                    parseFloat(notification.amount),
                    (data ?? DEFAULT_DYNAMIC_PROPS)?.hivePerMVests
                  ),
                  {
                    suffix: "HP"
                  }
                )
              : formattedNumber(rcFormatter(parseFloat(notification.amount)), {
                  suffix: "RC"
                })}
          </span>
        </span>
      </div>
    </div>
  );
}
