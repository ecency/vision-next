import { useActiveAccount } from "@/core/hooks/use-active-account";
import { LoginType, User } from "@/entities";
import { UserAvatar } from "@/features/shared";
import { UilTrash } from "@tooni/iconscout-unicons-react";
import { Button } from "@ui/button";
import { PopoverConfirm } from "@ui/popover-confirm";
import { classNameObject } from "@ui/util";
import React, { useRef, useState } from "react";
import { useDeleteUserFromList, useUserSelect } from "./hooks";

function LoginTypeBadge({ loginType }: { loginType?: LoginType }) {
  const src =
    loginType === "metamask" ? "/assets/metamask-fox.svg" :
    loginType === "keychain" || loginType === "keychain-mobile" ? "/assets/keychain.png" :
    loginType === "hivesigner" ? "/assets/hive-signer.svg" :
    null;

  return (
    <div
      className="absolute -right-0.5 -bottom-0.5 w-[18px] h-[18px] rounded-full bg-white dark:bg-dark-200 flex items-center justify-center shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
      title={loginType}
    >
      <img src={src ?? "/assets/hive-logo.svg"} alt="" className="w-3 h-3 object-contain" />
    </div>
  );
}

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
      <div className="relative flex-shrink-0">
        <UserAvatar username={user.username} size={compact ? "small" : "medium"} />
        <LoginTypeBadge loginType={user.loginType} />
        {activeUser?.username === user.username && (
          <div className="rounded-full absolute left-0 bottom-0 p-0.5 bg-white dark:bg-dark-200">
            <div className="bg-green w-2 h-2 rounded-full" />
          </div>
        )}
      </div>
      <span className="username max-w-full truncate">@{user.username}</span>
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
