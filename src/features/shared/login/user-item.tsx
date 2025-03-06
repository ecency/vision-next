import { useGlobalStore } from "@/core/global-store";
import { User } from "@/entities";
import { UserAvatar } from "@/features/shared";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { PopoverConfirm } from "@ui/popover-confirm";
import { classNameObject } from "@ui/util";
import React from "react";
import { useDeleteUserFromList, useUserSelect } from "./hooks";

interface Props {
  user: User;
  disabled: boolean;
  containerRef?: React.RefObject<HTMLInputElement>;
}

export function UserItem({ disabled, user, containerRef }: Props) {
  const activeUser = useGlobalStore((state) => state.activeUser);

  const { mutateAsync: select } = useUserSelect(user);
  const deleteUser = useDeleteUserFromList(user);

  return (
    <div
      className={classNameObject({
        "user-list-item flex items-center pointer text-base p-2 rounded-full relative": true,
        "text-blue-dark-sky bg-blue-duck-egg dark:bg-blue-metallic-20 dark:text-blue-powder hover:bg-blue-dark-sky-030 dark:hover:bg-blue-metallic duration-300":
          true,
        disabled: disabled,
        active: !!activeUser && activeUser.username === user.username
      })}
      onClick={() => select()}
    >
      <UserAvatar username={user.username} size="medium" />
      <span className="username">@{user.username}</span>
      {activeUser?.username === user.username && (
        <div className="rounded-full absolute left-8 bottom-1 p-1 bg-blue-duck-egg dark:bg-blue-metallic-20">
          <div className="bg-green w-3 h-3 rounded-full" />
        </div>
      )}
      <div className="flex-spacer" />
      <PopoverConfirm
        onConfirm={() => deleteUser()}
        placement="left"
        trigger="click"
        containerRef={containerRef}
      >
        <Button appearance="secondary" size="sm" type="button">
          <UilTrash className="w-3.5 h-3.5" />
        </Button>
      </PopoverConfirm>
    </div>
  );
}
