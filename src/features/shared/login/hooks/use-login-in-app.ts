import { useHsLoginRefresh, useRecordUserActivity } from "@/api/mutations";
import { useGlobalStore } from "@/core/global-store";
import { Account, User } from "@/entities";
import { usePathname, useRouter } from "next/navigation";
import { useCallback } from "react";
import { useAfterLoginTutorial } from "./use-after-login-tutorial";

export function useLoginInApp(username: string) {
  const pathname = usePathname();
  const router = useRouter();

  const addUser = useGlobalStore((state) => state.addUser);
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const updateActiveUser = useGlobalStore((state) => state.updateActiveUser);
  const toggleUIProp = useGlobalStore((state) => state.toggleUiProp);

  const { mutateAsync: recordActivity } = useRecordUserActivity();
  const { mutateAsync: hsTokenRenew } = useHsLoginRefresh();

  const handleTutorial = useAfterLoginTutorial(username);

  const hide = useCallback(() => {
    toggleUIProp("login");
  }, []);

  return useCallback(
    async (code: string, postingKey: null | undefined | string, account: Account) => {
      const token = await hsTokenRenew({ code });
      // get access token from code
      const user: User = {
        username: token.username,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresIn: token.expires_in,
        postingKey
      };

      // add / update user data
      addUser(user);

      // activate user
      setActiveUser(user.username);

      // add account data of the user to the reducer
      await updateActiveUser(account);

      // login activity
      recordActivity({ ty: 20 });

      // redirection based on path name
      if (pathname.startsWith("/signup")) {
        const u = `/@${token.username}/feed`;
        router.push(u);
      }

      handleTutorial();

      hide();
    },
    [
      addUser,
      handleTutorial,
      hide,
      hsTokenRenew,
      pathname,
      recordActivity,
      router,
      setActiveUser,
      updateActiveUser
    ]
  );
}
