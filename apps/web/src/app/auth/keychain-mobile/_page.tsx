"use client";

import useMount from "react-use/lib/useMount";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "@/entities";
import { useGlobalStore } from "@/core/global-store";
import { useHsLoginRefresh, useRecordUserActivity } from "@/api/mutations";
import { useCallback, useState } from "react";
import * as Sentry from "@sentry/nextjs";
import Image from "next/image";
import i18next from "i18next";
import { UilSpinner } from "@tooni/iconscout-unicons-react";
import { Alert } from "@ui/alert";
import defaults from "@/defaults";
import { b64uEnc } from "@/utils/b64";
import type { KeychainMobilePendingLogin } from "@/features/shared/login/hooks/use-login-by-keychain";

const KEYCHAIN_MOBILE_STORAGE_KEY = "ecency_keychain-mobile-pending-login";
const PENDING_LOGIN_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export function KeychainMobileAuthPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const addUser = useGlobalStore((state) => state.addUser);
  const setActiveUser = useGlobalStore((s) => s.setActiveUser);

  const { mutate: recordActivity } = useRecordUserActivity();
  const { mutateAsync: hsTokenRenew } = useHsLoginRefresh();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const completeLogin = useCallback(async () => {
    const sig = searchParams?.get("sig");

    if (!sig) {
      setErrorMessage(i18next.t("login.keychain-mobile-missing-sig", { defaultValue: "Missing signature from Keychain. Please try again." }));
      return;
    }

    // Retrieve pending login data from localStorage
    const pendingRaw = localStorage.getItem(KEYCHAIN_MOBILE_STORAGE_KEY);
    if (!pendingRaw) {
      setErrorMessage(i18next.t("login.keychain-mobile-no-pending", { defaultValue: "No pending login found. Please try logging in again." }));
      return;
    }

    let pending: KeychainMobilePendingLogin;
    try {
      pending = JSON.parse(pendingRaw);
    } catch {
      localStorage.removeItem(KEYCHAIN_MOBILE_STORAGE_KEY);
      setErrorMessage(i18next.t("login.keychain-mobile-invalid-data", { defaultValue: "Invalid login data. Please try again." }));
      return;
    }

    // Check expiry
    if (Date.now() - pending.timestamp > PENDING_LOGIN_MAX_AGE_MS) {
      localStorage.removeItem(KEYCHAIN_MOBILE_STORAGE_KEY);
      setErrorMessage(i18next.t("login.keychain-mobile-expired", { defaultValue: "Login request expired. Please try again." }));
      return;
    }

    // Clean up pending login data
    localStorage.removeItem(KEYCHAIN_MOBILE_STORAGE_KEY);

    try {
      // Add the signature to the message object and encode as HiveSigner code
      const messageObj = { ...pending.messageObj, signatures: [sig] };
      const code = b64uEnc(JSON.stringify(messageObj));

      // Exchange code for access token
      const response = await hsTokenRenew({ code });
      const user: User = {
        username: response.username,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        expiresIn: response.expires_in,
        postingKey: null,
        loginType: "keychain-mobile"
      };

      addUser(user);
      setActiveUser(user.username);
      recordActivity({ ty: 20 });

      router.push(`/@${user.username}/feed`);
    } catch (e) {
      Sentry.captureException(e);
      const detail = e instanceof Error ? e.message : String(e);
      setErrorMessage(`${i18next.t("login.keychain-mobile-error", { defaultValue: "Login failed. Please try again." })}\n${detail}`);
    }
  }, [
    addUser,
    hsTokenRenew,
    recordActivity,
    router,
    searchParams,
    setActiveUser
  ]);

  useMount(() => {
    completeLogin();
  });

  return (
    <div className="flex gap-4 md:gap-8 lg:gap-12 items-center justify-start flex-col p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 w-full dark:bg-black">
      <Image src={defaults.logo} alt="logo" width={128} height={128} />
      <h1 className="text-xl md:text-3xl lg:text-4xl xl:text-6xl font-semibold text-blue-dark-sky">
        {errorMessage
          ? i18next.t("login.keychain-mobile-title-error", { defaultValue: "Login Failed" })
          : i18next.t("login.keychain-mobile-title", { defaultValue: "Completing Login..." })
        }
      </h1>
      {errorMessage ? (
        <Alert appearance="warning">
          <p className="md:text-lg lg:text-xl p-2">{errorMessage}</p>
        </Alert>
      ) : (
        <>
          <Alert>
            <p className="md:text-lg lg:text-xl p-2">
              {i18next.t("login.keychain-mobile-message", { defaultValue: "Verifying your signature and logging you in..." })}
            </p>
          </Alert>
          <UilSpinner className="animate-spin w-6 h-6 lg:w-8 lg:h-8" />
        </>
      )}
    </div>
  );
}
