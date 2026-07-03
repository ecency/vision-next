"use client";

import { ProfilePopover, UserAvatar } from "@/features/shared";
import { Entry } from "@/entities";
import { PropsWithChildren, ReactNode } from "react";

interface Props {
  username: string;
  i: number;
  prefix?: ReactNode;
}

export function UsersTableListItem({ username, children, prefix }: PropsWithChildren<Props>) {
  return (
    <div className="relative bg-gray-100 dark:bg-dark-200 border border-[--border-color] rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {prefix}
        <UserAvatar size="medium" username={username} />
        <ProfilePopover entry={{ author: username } as Entry} />
      </div>
      <div className="flex items-center gap-4">{children}</div>
    </div>
  );
}
