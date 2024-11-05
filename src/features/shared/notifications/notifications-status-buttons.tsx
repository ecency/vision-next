import { Button } from "@ui/button";
import React from "react";
import { NotificationViewType } from "@/enums";
import { Tooltip } from "@ui/tooltip";
import i18next from "i18next";
import { playListAddCheck } from "@ui/svg";
import { UilCheckSquare, UilMinusSquare } from "@tooni/iconscout-unicons-react";

interface Props {
  currentStatus: NotificationViewType;
  onStatusClick: (v: string) => void;
  isSelectIcon: boolean;
  select: boolean;
  onSelectClick?: () => void;
  isMarkingAsRead: boolean;
  onMarkAsRead: () => void;
}

export function NotificationsStatusButtons({
  currentStatus,
  onStatusClick,
  onSelectClick,
  isSelectIcon,
  isMarkingAsRead,
  select,
  onMarkAsRead
}: Props) {
  return (
    <div className="status-button-container">
      <div className="flex gap-2 px-3">
        {Object.values(NotificationViewType).map((status: string, k: number) => {
          return (
            <Button
              size="sm"
              outline={currentStatus !== status}
              key={k}
              tabIndex={-1}
              onClick={() => onStatusClick(status)}
            >
              {status}
            </Button>
          );
        })}
      </div>

      <div className="select-buttons">
        {isSelectIcon && (
          <Tooltip content={i18next.t("notifications.mark-selected-read")}>
            <Button
              size="sm"
              isLoading={isMarkingAsRead}
              icon={playListAddCheck}
              appearance="gray-link"
              onClick={onMarkAsRead}
            />
          </Tooltip>
        )}

        <Tooltip
          content={select ? i18next.t("notifications.unselect") : i18next.t("notifications.select")}
        >
          <Button
            size="sm"
            appearance="gray-link"
            onClick={onSelectClick}
            icon={
              select ? (
                <UilMinusSquare className="w-4 h-4" />
              ) : (
                <UilCheckSquare className="w-4 h-4" />
              )
            }
          />
        </Tooltip>
      </div>
    </div>
  );
}
