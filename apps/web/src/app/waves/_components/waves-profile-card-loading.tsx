import Image from "next/image";
import { UserAvatarLoading } from "@/features/shared";
import React from "react";

export function WavesProfileCardLoading() {
  return (
    <div className="rounded-2xl overflow-hidden relative bg-white dark:bg-dark-200 p-4">
      <Image
        className="absolute top-0 left-0 w-full h-[156px]"
        src="/assets/promote-wave-bg.jpg"
        alt=""
        width={300}
        height={200}
      />
      <div className="relative flex flex-col mt-[100px] gap-2">
        <UserAvatarLoading size="large" className="mb-2" />
        <div className="animate-pulse h-[16px] rounded-lg w-[96px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />

        <div className="grid grid-cols-2">
          <div>
            <div className="animate-pulse h-[16px] mb-1 rounded-lg w-[48px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
            <div className="animate-pulse h-[24px] rounded-lg w-[32px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          </div>
          <div>
            <div className="animate-pulse h-[16px] mb-1 rounded-lg w-[48px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
            <div className="animate-pulse h-[24px] rounded-lg w-[48px] bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
          </div>
        </div>
        <div className="animate-pulse h-[8px] rounded-lg w-full bg-blue-dark-sky-040 dark:bg-blue-dark-grey" />
      </div>
    </div>
  );
}
