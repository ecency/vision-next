import { UserAvatarLoading } from "@/features/shared";
import React from "react";
import { ButtonLoading } from "@ui/button";

interface Props {
  small?: boolean;
  vertical?: boolean;
}

export function CommunityListItemLoading({ small, vertical }: Props) {
  return (
    <div className={"community-list-item " + (small ? "small" : "") + (vertical ? "vertical" : "")}>
      <div className="item-content">
        <h2 className="item-title">
          <div className="item-details">
            <UserAvatarLoading size={small ? "small" : "medium"} />
            <div className="animate-pulse h-[24px] rounded-lg w-[96px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          </div>
          {small && (
            <div className="item-controls">
              <ButtonLoading size={small ? "sm" : "md"} />
            </div>
          )}
        </h2>
        <div className="animate-pulse h-[16px] rounded-lg w-full bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        <div className="flex gap-1 mt-1">
          <div className="animate-pulse h-[16px] rounded-lg w-[48px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          <div className="animate-pulse h-[16px] rounded-lg w-[48px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          <div className="animate-pulse h-[16px] rounded-lg w-[48px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
        </div>
        <div className="animate-pulse h-[16px] rounded-lg w-[96px] mt-2 bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
    </div>
  );
}
