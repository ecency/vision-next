"use client";

import React from "react";
import "./index.scss";
import { Entry } from "@/entities";
import { Popover } from "@ui/popover";
import { ProfilePreview } from "@/features/shared/profile-popover/profile-preview";

export const ProfilePopover = ({ entry }: { entry: Entry }) => {
  const author = entry.original_entry ? entry.original_entry.author : entry.author;

  return (
    <Popover
      behavior="hover"
      useMobileSheet={true}
      placement="bottom-start"
      directContent={
        <div className="notranslate relative hover:bg-gray-200 font-bold dark:hover:bg-gray-800 rounded-2xl px-2 pointer duration-300">
          {author}
        </div>
      }
      customClassName="rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-xl w-[320px]"
    >
      <ProfilePreview username={author} />
    </Popover>
  );
};
