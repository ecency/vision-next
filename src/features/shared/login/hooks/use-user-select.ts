import { getAccount } from "@/api/hive";
import { User } from "@/entities";
import { getRefreshToken } from "@/utils";
import { useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { useLoginInApp } from "./use-login-in-app";
import i18next from "i18next";
import { error } from "../../feedback";
import { useGlobalStore } from "@/core/global-store";

export function useUserSelect(user: User) {
  const deleteUser = useGlobalStore((state) => state.deleteUser);

  const loginInApp = useLoginInApp(user.username);

  return useMutation({
    mutationKey: ["user-select"],
    mutationFn: async () => {
      try {
        const account = await getAccount(user.username);
        let token = getRefreshToken(user.username);
        if (token) {
          await loginInApp(token, user.postingKey, account);
        } else {
          deleteUser(user.username);
          throw new Error(`${i18next.t("login.error-user-not-found-cache")}`);
        }
      } catch (e) {
        console.error(e);
        throw new Error(i18next.t("g.server-error"));
      }
    },
    onError: (e) => error(e.message)
  });
}
