"use client";

import useMount from "react-use/lib/useMount";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import i18next from "i18next";
import { UilCheckCircle, UilSpinner } from "@tooni/iconscout-unicons-react";
import { Alert } from "@ui/alert";
import defaults from "@/defaults";

const KEYCHAIN_MOBILE_SIGN_STORAGE_KEY = "ecency_keychain-mobile-pending-sign";
const PENDING_SIGN_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export function KeychainSignPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  const handleCallback = useCallback(() => {
    const txId = searchParams?.get("id");
    const sig = searchParams?.get("sig");

    // Retrieve the stored return path
    const pendingRaw = localStorage.getItem(KEYCHAIN_MOBILE_SIGN_STORAGE_KEY);
    localStorage.removeItem(KEYCHAIN_MOBILE_SIGN_STORAGE_KEY);

    if (!txId && !sig) {
      setStatus("error");
      setErrorMessage(i18next.t("login.keychain-sign-missing-result", {
        defaultValue: "No transaction result received from Keychain."
      }));
      return;
    }

    let returnPath = "/";
    if (pendingRaw) {
      try {
        const pending = JSON.parse(pendingRaw);
        if (Date.now() - pending.timestamp < PENDING_SIGN_MAX_AGE_MS) {
          returnPath = pending.returnPath || "/";
        }
      } catch {
        // Ignore parse errors
      }
    }

    setStatus("success");

    // Redirect back after a short delay so user sees the success state
    redirectTimerRef.current = setTimeout(() => {
      router.push(returnPath);
      router.refresh();
    }, 1500);
  }, [router, searchParams]);

  useMount(() => {
    handleCallback();
  });

  return (
    <div className="flex gap-4 md:gap-8 lg:gap-12 items-center justify-start flex-col p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 w-full dark:bg-black">
      <Image src={defaults.logo} alt="logo" width={128} height={128} />

      {status === "loading" && (
        <>
          <h1 className="text-xl md:text-3xl font-semibold text-blue-dark-sky">
            {i18next.t("login.keychain-sign-processing", { defaultValue: "Processing..." })}
          </h1>
          <UilSpinner className="animate-spin w-6 h-6 lg:w-8 lg:h-8" />
        </>
      )}

      {status === "success" && (
        <>
          <h1 className="text-xl md:text-3xl font-semibold text-green">
            {i18next.t("login.keychain-sign-success", { defaultValue: "Transaction Signed" })}
          </h1>
          <UilCheckCircle className="w-12 h-12 text-green" />
          <Alert appearance="success">
            <p className="md:text-lg p-2">
              {i18next.t("login.keychain-sign-redirecting", { defaultValue: "Redirecting you back..." })}
            </p>
          </Alert>
        </>
      )}

      {status === "error" && (
        <>
          <h1 className="text-xl md:text-3xl font-semibold text-red">
            {i18next.t("login.keychain-sign-error-title", { defaultValue: "Signing Failed" })}
          </h1>
          <Alert appearance="warning">
            <p className="md:text-lg p-2">{errorMessage}</p>
          </Alert>
        </>
      )}
    </div>
  );
}
