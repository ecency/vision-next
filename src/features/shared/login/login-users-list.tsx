import { useGlobalStore } from "@/core/global-store";
import clsx from "clsx";
import i18next from "i18next";
import Image from "next/image";
import { useMemo } from "react";
import { LoginUserItem } from "./login-user-item";
import { LoginUsersReorder } from "./login-users-reorder";

export function LoginUsersList() {
  const users = useGlobalStore((state) => state.users);
  const activeUser = useGlobalStore((state) => state.activeUser);

  const activeUserItem = useMemo(
    () => users.find((user) => user.username === activeUser?.username),
    [users, activeUser]
  );

  return (
    <div>
      {users.length > 0 && (
        <div className="flex flex-col gap-4 md:pr-6 md:border-r border-[--border-color]">
          <div className="text-xs uppercase font-bold opacity-50 mt-4">
            {i18next.t("login.current")}
          </div>
          {activeUserItem && <LoginUserItem user={activeUserItem} />}
          {!activeUserItem && <div className="">{i18next.t("login.no-active-user")}</div>}

          {users.length > 1 && (
            <div className="flex items-center mt-4 justify-between">
              <div className="text-xs uppercase font-bold opacity-50">
                {i18next.t("g.login-as")}
              </div>
              <LoginUsersReorder />
            </div>
          )}
          {users.length === 1 && (
            <div className="text-gray-600 dark:text-gray-400">
              {i18next.t("login.single-account-hint")}
            </div>
          )}
          <div
            className={clsx(
              "grid gap-4 max-h-[186px] overflow-y-auto",
              users.length > 4 ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {users
              .filter((u) => u.username !== activeUser?.username)
              .map((u) => (
                <LoginUserItem compact={true} key={u.username} user={u} />
              ))}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center">
          <Image
            width={400}
            height={400}
            src="/assets/undraw-login.svg"
            alt="Logo"
            className="max-w-[300px] pt-4"
          />
        </div>
      )}
    </div>
  );
}
