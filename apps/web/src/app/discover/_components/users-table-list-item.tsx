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
    <div className="relative reading-surface border border-[--border-color] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0 flex-[1_1_200px] flex items-center gap-2">
        {prefix}
        <div className="shrink-0">
          <UserAvatar size="medium" username={username} />
        </div>
        <div className="min-w-0 [overflow-wrap:anywhere]">
          <ProfilePopover entry={{ author: username } as Entry} />
        </div>
      </div>
      <div className="min-w-0 max-w-full ml-auto flex flex-wrap items-center justify-end gap-3 text-right [overflow-wrap:anywhere]">
        {children}
      </div>
    </div>
  );
}
