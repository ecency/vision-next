"use client";

import { UilCheckCircle, UilTimesCircle } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function HsCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();

  const txId = params?.get("id") ?? "";
  const block = params?.get("block") ?? "";
  const rawRedirect = params?.get("redirect") ?? "/";

  // Sanitize redirect to prevent open-redirect attacks
  const redirect = rawRedirect.startsWith("/") && !rawRedirect.startsWith("//")
    ? rawRedirect
    : "/";

  const isSuccess = txId.length > 0 || block.length > 0;
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown <= 0) {
      router.push(redirect);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, redirect, router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-dark-200 rounded-2xl shadow-lg max-w-md w-full mx-4">
        {isSuccess ? (
          <>
            <UilCheckCircle className="text-green w-16 h-16" />
            <h2 className="text-xl font-bold text-green">
              {i18next.t("g.success")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {i18next.t("transactions.success-hint")}
            </p>
            {txId && (
              <code className="text-xs text-gray-500 break-all">{txId}</code>
            )}
          </>
        ) : (
          <>
            <UilTimesCircle className="text-red w-16 h-16" />
            <h2 className="text-xl font-bold text-red">
              {i18next.t("g.error")}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {i18next.t("transactions.error-hint")}
            </p>
          </>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {i18next.t("g.redirecting-in", { defaultValue: `Redirecting in ${countdown}s...`, n: countdown })}
        </p>
      </div>
    </div>
  );
}
