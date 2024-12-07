import { UserAvatarLoading } from "@/features/shared";
import React from "react";

export function WaveListItemHeaderLoading() {
  return (
    <div className="flex justify-between px-4 pt-4">
      <div className="flex items-center gap-4">
        <UserAvatarLoading size="deck-item" />
        <div className="flex flex-col truncate">
          <div className="flex items-center gap-2">
            <div className="animate-pulse h-[14px] rounded-lg w-[96px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
            <div className="animate-pulse h-[12px] rounded-lg w-[48px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          </div>
        </div>
      </div>

      <div className="animate-pulse h-[16px] rounded-lg w-[32px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
    </div>
  );
}
