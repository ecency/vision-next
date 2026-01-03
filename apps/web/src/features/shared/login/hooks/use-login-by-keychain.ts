import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useLoginInApp } from "./use-login-in-app";
import { getAccountFullQuery } from "@/api/queries";
import { EcencyConfigManager } from "@/config";
import { addAccountAuthority, makeHsCode, signBuffer } from "@/utils";
import { shouldUseHiveAuth, signWithHiveAuth } from "@/utils/client";
import i18next from "i18next";
import { error } from "../../feedback";
import { formatError } from "@/api/operations";
import { LoginType } from "@/entities";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_SECONDS = 5;
const HIVE_AUTH_TIMEOUT_MS = 15000;

class HiveAuthTimeoutError extends Error {
  constructor(message = "HiveAuth verification timed out") {
    super(message);
    this.name = "HiveAuthTimeoutError";
  }
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  if (typeof document === "undefined") {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new HiveAuthTimeoutError());
      }, timeoutMs);

      promise
        .then((value) => {
          clearTimeout(timer);
          resolve(value);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  return new Promise<T>((resolve, reject) => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let remaining = timeoutMs;
    let lastStarted = Date.now();

    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const onTimeout = () => {
      cleanup();
      reject(new HiveAuthTimeoutError());
    };

    const startTimer = () => {
      clearTimer();
      lastStarted = Date.now();
      timer = setTimeout(onTimeout, remaining);
    };

    const pauseTimer = () => {
      if (!timer) return;
      clearTimer();
      remaining -= Date.now() - lastStarted;
      if (remaining < 0) {
        remaining = 0;
      }
    };

    const resumeTimer = () => {
      if (remaining <= 0) {
        onTimeout();
        return;
      }
      startTimer();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        pauseTimer();
      } else {
        resumeTimer();
      }
    };

    const cleanup = () => {
      clearTimer();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (document.hidden) {
      remaining = timeoutMs;
    } else {
      startTimer();
    }

    promise
      .then((value) => {
        cleanup();
        resolve(value);
      })
      .catch((err) => {
        cleanup();
        reject(err);
      });
  });
}

export function useLoginByKeychain(username: string) {
  const loginInApp = useLoginInApp(username);

  const accountQuery = getAccountFullQuery(username);
  const { data: account } = accountQuery.useClientQuery();

  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);
  const [isRetryScheduled, setIsRetryScheduled] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  const clearCountdownInterval = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const stopCountdown = useCallback(() => {
    clearCountdownInterval();
    setRetryCountdown(null);
    setIsRetryScheduled(false);
  }, [clearCountdownInterval]);

  const startCountdown = useCallback(
    (seconds: number) => {
      clearCountdownInterval();

      return new Promise<void>((resolve) => {
        setIsRetryScheduled(true);
        setRetryCountdown(seconds);

        let remaining = seconds;

        countdownIntervalRef.current = setInterval(() => {
          remaining -= 1;

          if (remaining <= 0) {
            clearCountdownInterval();
            setRetryCountdown(null);
            setIsRetryScheduled(false);
            resolve();
          } else {
            setRetryCountdown(remaining);
          }
        }, 1000);
      });
    },
    [clearCountdownInterval]
  );

  useEffect(() => () => stopCountdown(), [stopCountdown]);

  const mutation = useMutation({
    mutationKey: ["login-by-keychain", username, account],
    mutationFn: async () => {
      const accountData = account ?? (await accountQuery.fetchAndGet());

      if (!accountData) {
        throw new Error(i18next.t("login.error-user-not-found"));
      }

      const hasPostingPerm =
        accountData.posting!.account_auths.filter(
          (x) => x[0] === EcencyConfigManager.CONFIG.service.hsClientId
        ).length > 0;

      /*if (!hasPostingPerm) {
        const weight = accountData.posting!.weight_threshold;

        try {
          await addAccountAuthority(
            username,
            EcencyConfigManager.CONFIG.service.hsClientId,
            "Posting",
            weight
          );
        } catch (err) {
          throw new Error(i18next.t("login.error-permission"));
        }
      }*/

      stopCountdown();
      setRetryAttempt(0);

      const useHiveAuth = shouldUseHiveAuth();
      const loginMethod: LoginType = useHiveAuth ? "hiveauth" : "keychain";

      const signMessage = async (message: string) => {
        if (useHiveAuth || shouldUseHiveAuth()) {
          return signWithHiveAuth(username, message, accountData, "posting");
        }

        return signBuffer(username, message, "Posting").then((r) => r.result);
      };

      if (!useHiveAuth) {
        const code = await makeHsCode(
          EcencyConfigManager.CONFIG.service.hsClientId,
          username,
          signMessage
        );

        await loginInApp(code, null, accountData, loginMethod);
        return;
      }

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        setRetryAttempt(attempt);
        setIsRetryScheduled(false);
        setRetryCountdown(null);

        try {
          const code = await withTimeout(
            makeHsCode(
              EcencyConfigManager.CONFIG.service.hsClientId,
              username,
              signMessage
            ),
            HIVE_AUTH_TIMEOUT_MS
          );

          await loginInApp(code, null, accountData, loginMethod);
          stopCountdown();
          return;
        } catch (err) {
          if (err instanceof HiveAuthTimeoutError) {
            if (attempt >= MAX_ATTEMPTS) {
              stopCountdown();
              throw new Error("Service failed to verify login. Please try again.");
            }

            const nextAttempt = attempt + 1;
            setRetryAttempt(nextAttempt);
            await startCountdown(RETRY_DELAY_SECONDS);
            continue;
          }

          stopCountdown();
          throw err;
        }
      }

      throw new Error("Service failed to verify login. Please try again.");
    },
    onError: (e) => error(...formatError(e)),
    onSettled: () => {
      stopCountdown();
      setRetryAttempt(0);
    }
  });

  return {
    ...mutation,
    retryCountdown,
    isRetryScheduled,
    retryAttempt,
    maxAttempts: MAX_ATTEMPTS
  };
}
