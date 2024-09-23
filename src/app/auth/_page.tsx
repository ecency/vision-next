"use client";

import useMount from "react-use/lib/useMount";
import { useRouter, useSearchParams } from "next/navigation";
import { validateToken } from "@/utils";
import { User } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { useHsLoginRefresh, useRecordUserActivity } from "@/api/mutations";
import { useCallback } from "react";
import * as Sentry from "@sentry/nextjs";

export function AuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const addUser = useGlobalStore((state) => state.addUser);
  const setActiveUser = useGlobalStore((s) => s.setActiveUser);
  const updateActiveUser = useGlobalStore((s) => s.updateActiveUser);
  const toggleUiProp = useGlobalStore((s) => s.toggleUiProp);

  const { mutateAsync: recordActivity } = useRecordUserActivity();
  const { mutateAsync: hsTokenRenew } = useHsLoginRefresh();

  const initUser = useCallback(async () => {
    const code = searchParams.get("code");
    const isValidToken = validateToken(code);

    if (!code || !isValidToken) {
      router.push("/");
      toggleUiProp("login");
      return;
    }

    try {
      const response = await hsTokenRenew({ code });
      const user: User = {
        username: response.username,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
        postingKey: null
      };

      addUser(user);
      setActiveUser(user.username);

      await updateActiveUser();
      recordActivity({ ty: 20 });

      router.push(`/@${user.username}/feed`);
    } catch (e) {
      Sentry.captureException(e);
    }
  }, [
    addUser,
    hsTokenRenew,
    recordActivity,
    router,
    searchParams,
    setActiveUser,
    toggleUiProp,
    updateActiveUser
  ]);

  useMount(() => {
    initUser();
  });

  return <></>;
}
