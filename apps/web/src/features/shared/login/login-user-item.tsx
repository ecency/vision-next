import { useActiveAccount } from "@/core/hooks/use-active-account";
import { User } from "@/entities";
import { UserAvatar } from "@/features/shared";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { PopoverConfirm } from "@ui/popover-confirm";
import { classNameObject } from "@ui/util";
import React, { useRef, useState } from "react";
import { useDeleteUserFromList, useUserSelect } from "./hooks";

interface Props {
  user: User;
  compact?: boolean;
}

export function LoginUserItem({ user, compact = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { activeUser } = useActiveAccount();

  const [showDelete, setShowDelete] = useState(false);

  const { mutateAsync: select } = useUserSelect(user);
  const deleteUser = useDeleteUserFromList(user);

  return (
    <div
      ref={containerRef}
      className={classNameObject({
        "flex items-center pointer rounded-full p-2 relative gap-2": true,
        "border border-[--border-color] hover:bg-gray-100 dark:hover:bg-dark-default duration-300":
          true,
        "text-sm h-[46px]": compact,
        "text-base": !compact,
        active: !!activeUser && activeUser.username === user.username
      })}
      onClick={() => select()}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <UserAvatar username={user.username} size={compact ? "small" : "medium"} />
      <span className="username max-w-full truncate">@{user.username}</span>
      {activeUser?.username === user.username && (
        <div className="rounded-full absolute left-8 bottom-1 p-1 bg-white">
          <div className="bg-green w-3 h-3 rounded-full" />
        </div>
      )}
      <div className="flex-spacer" />
      {showDelete && (
        <PopoverConfirm
          onConfirm={() => deleteUser()}
          placement="left"
          trigger="click"
          containerRef={containerRef}
        >
          <Button appearance="gray-link" size="sm" type="button" icon={<UilTrash />} />
        </PopoverConfirm>
      )}
    </div>
  );
}
