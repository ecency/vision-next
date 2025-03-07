import { useGlobalStore } from "@/core/global-store";
import i18next from "i18next";
import Image from "next/image";
import { LoginUserItem } from "./login-user-item";
import { useMemo } from "react";

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
      {users.length === 0 && (
        <div className="h-full flex flex-col items-center justify-start">
          <div className="w-full">
            <div className="text-xl w-full font-bold">{i18next.t("login.title")}</div>
            <div className="w-full text-gray-600 dark:text-gray-400">
              {i18next.t("login.subtitle")}
            </div>
          </div>
          <Image
            width={400}
            height={400}
            src="/assets/undraw-login.svg"
            alt="Logo"
            className="max-w-[300px] py-16"
          />
        </div>
      )}
      {users.length > 0 && (
        <div className="flex flex-col gap-4">
          <div>
            <div className="text-xl w-full font-bold">{i18next.t("login.title")}</div>
            <div className="w-full text-gray-600 dark:text-gray-400">
              {i18next.t("login.subtitle-users")}
            </div>
          </div>
          <div className="text-xs uppercase font-bold opacity-50 mt-4">
            {i18next.t("login.current")}
          </div>
          {activeUserItem && <LoginUserItem disabled={loginInProgress} user={activeUserItem} />}

          <div className="text-xs uppercase mt-4 font-bold opacity-50">
            {i18next.t("g.login-as")}
          </div>
          {users
            .filter((u) => u.username !== activeUser?.username)
            .map((u) => (
              <LoginUserItem key={u.username} disabled={loginInProgress} user={u} />
            ))}
        </div>
      )}
    </div>
  );
}
