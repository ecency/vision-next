"use client";

import useMount from "react-use/lib/useMount";
import { useRouter, useSearchParams } from "next/navigation";
import { validateToken } from "@/utils";
import { User } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { useHsLoginRefresh, useRecordUserActivity } from "@/api/mutations";
import { useCallback } from "react";
import * as Sentry from "@sentry/nextjs";
import Image from "next/image";
import i18next from "i18next";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import { Alert } from "@ui/alert";

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
    const code = searchParams?.get("code");
    const isValidToken = validateToken(code ?? "");

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

  return (
    <div className="flex gap-4 md:gap-8 lg:gap-12 items-center justify-start flex-col p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 w-full dark:bg-black">
      <Image src="/assets/logo-circle.svg" alt="logo" width={128} height={128} />
      <h1 className="text-xl md:text-3xl lg:text-4xl xl:text-6xl font-semibold text-blue-dark-sky">
        {i18next.t("hs-login.title")}
      </h1>
      <Alert>
        <p className="md:text-lg lg:text-xl p-2">{i18next.t("hs-login.message")}</p>
      </Alert>
      <UilSpinner className="animate-spin w-6 h-6 lg:w-8 lg:h-8" />
    </div>
  );
}
