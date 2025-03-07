import { useGlobalStore } from "@/core/global-store";
import i18next from "i18next";
import Image from "next/image";
import { LoginUserItem } from "./login-user-item";
import { useMemo } from "react";
import clsx from "clsx";

interface Props {
  loginInProgress: boolean;
}

export function LoginUsersList({ loginInProgress }: Props) {
  const users = useGlobalStore((state) => state.users);
  const activeUser = useGlobalStore((state) => state.activeUser);

  const activeUserItem = useMemo(
    () => users.find((user) => user.username === activeUser?.username),
    [users, activeUser]
  );

  return (
    <div>
      {users.length > 0 && (
        <div className="flex flex-col gap-4">
          <div className="text-xs uppercase font-bold opacity-50 mt-4">
            {i18next.t("login.current")}
          </div>
          {activeUserItem && <LoginUserItem disabled={loginInProgress} user={activeUserItem} />}

          {users.length > 1 && (
            <div className="text-xs uppercase mt-4 font-bold opacity-50">
              {i18next.t("g.login-as")}
            </div>
          )}
          {users.length === 1 && (
            <div className="text-gray-600 dark:text-gray-400">
              {i18next.t("login.single-account-hint")}
            </div>
          )}
          <div className={clsx("grid gap-4", users.length > 4 ? "grid-cols-2" : "grid-cols-1")}>
            {users
              .filter((u) => u.username !== activeUser?.username)
              .map((u) => (
                <LoginUserItem
                  compact={true}
                  key={u.username}
                  disabled={loginInProgress}
                  user={u}
                />
              ))}
          </div>
        </div>
      )}

      {users.length === 0 && (
        <div className="h-full flex flex-col items-center justify-start">
          <Image
            width={400}
            height={400}
            src="/assets/undraw-login.svg"
            alt="Logo"
            className="max-w-[300px] py-16"
          />
        </div>
      )}
    </div>
  );
}
