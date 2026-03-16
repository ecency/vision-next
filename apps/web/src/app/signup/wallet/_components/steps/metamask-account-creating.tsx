"use client";

import { getQueryClient } from "@/core/react-query";
import { Button } from "@/features/ui";
import { error } from "@/features/shared";
import { useLoginByMetaMask } from "@/features/shared/login/hooks/use-login-by-metamask";
import { delay } from "@/utils";
import { EcencyAnalytics, getAccountFullQueryOptions, ConfigManager } from "@ecency/sdk";
import type { FullAccount as FullAccountEntity } from "@/entities";
import { EcencyWalletCurrency } from "@ecency/wallets";
import { UilCheckCircle, UilSpinner } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";

const HIVE_SNAP_ID = "npm:@hiveio/metamask-snap";

interface Props {
  username: string;
  verifiedWallet: {
    currency: EcencyWalletCurrency;
    address: string;
    addresses: Partial<Record<EcencyWalletCurrency, string>>;
  };
}

interface HivePublicKey {
  publicKey: string;
  role?: string;
  accountIndex: number;
  addressIndex: number;
}

async function installHiveSnap(): Promise<void> {
  await window.ethereum!.request({
    method: "wallet_requestSnaps",
    params: { [HIVE_SNAP_ID]: {} }
  });
}

async function getHivePublicKeys(): Promise<HivePublicKey[]> {
  const result = await window.ethereum!.request({
    method: "wallet_invokeSnap",
    params: {
      snapId: HIVE_SNAP_ID,
      request: {
        method: "hive_getPublicKeys",
        params: {
          keys: [
            { role: "owner", accountIndex: 0 },
            { role: "active", accountIndex: 0 },
            { role: "posting", accountIndex: 0 },
            { role: "memo", accountIndex: 0 }
          ]
        }
      }
    }
  });
  return (result as { publicKeys: HivePublicKey[] }).publicKeys;
}

async function createAccountWithWallets(
  username: string,
  currency: string,
  address: string,
  walletAddresses: Partial<Record<EcencyWalletCurrency, string>>,
  hiveKeys: {
    ownerPublicKey: string;
    activePublicKey: string;
    postingPublicKey: string;
    memoPublicKey: string;
  }
): Promise<Response> {
  const normalizedWalletAddresses = Object.fromEntries(
    Object.entries(walletAddresses)
      .filter(([, walletAddress]): walletAddress is string => Boolean(walletAddress))
  );

  return fetch(`${ConfigManager.getValidatedBaseUrl()}/private-api/wallets-add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username,
      token: currency,
      address,
      meta: {
        ...hiveKeys,
        ...normalizedWalletAddresses,
        [currency]: address
      }
    })
  });
}

export function MetamaskAccountCreating({ username, verifiedWallet }: Props) {
  const [status, setStatus] = useState<"installing-snap" | "getting-keys" | "creating" | "validating" | "success" | "logging-in" | "error">("installing-snap");
  const { mutateAsync: loginByMetaMask } = useLoginByMetaMask(username);
  const hasInitiatedRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);

  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    "signed-up-with-wallets"
  );

  const validateAccountIsCreated = useCallback(
    async (shouldStop?: () => boolean): Promise<FullAccountEntity> => {
      const accountQueryOptions = getAccountFullQueryOptions(username);
      const queryClient = getQueryClient();

      while (!shouldStop?.()) {
        try {
          const account = await queryClient.fetchQuery(accountQueryOptions);
          if (account) {
            queryClient.setQueryData(accountQueryOptions.queryKey, account);
            return account as unknown as FullAccountEntity;
          }
        } catch {
          /* Account might not yet exist; retry */
        }
        await delay(5000);
      }

      const abortError = new Error("Account validation aborted");
      abortError.name = "AbortError";
      throw abortError;
    },
    [username]
  );

  useEffect(() => {
    if (hasInitiatedRef.current) return;
    hasInitiatedRef.current = true;

    let cancelled = false;
    const shouldStop = () => cancelled;

    (async () => {
      try {
        // Step 1: Install Hive Snap
        setStatus("installing-snap");
        await installHiveSnap();
        if (shouldStop()) return;

        // Step 2: Get Hive public keys from snap
        setStatus("getting-keys");
        const publicKeys = await getHivePublicKeys();
        if (shouldStop()) return;

        const keysByRole = publicKeys.reduce<Record<string, string>>((acc, k) => {
          if (k.role) acc[k.role] = k.publicKey;
          return acc;
        }, {});

        const hiveKeys = {
          ownerPublicKey: keysByRole["owner"] ?? "",
          activePublicKey: keysByRole["active"] ?? "",
          postingPublicKey: keysByRole["posting"] ?? "",
          memoPublicKey: keysByRole["memo"] ?? ""
        };

        if (!hiveKeys.ownerPublicKey || !hiveKeys.postingPublicKey) {
          throw new Error("Failed to derive Hive keys from MetaMask snap");
        }

        // Step 3: Create account via backend
        setStatus("creating");
        const response = await createAccountWithWallets(
          username,
          verifiedWallet.currency,
          verifiedWallet.address,
          verifiedWallet.addresses,
          hiveKeys
        );

        if (!response.ok) {
          throw new Error("Account creation failed");
        }
        if (shouldStop()) return;

        // Step 4: Wait for account to appear on-chain
        setStatus("validating");
        await delay(5000);
        await validateAccountIsCreated(shouldStop);
        if (shouldStop()) return;

        // Step 5: Record analytics
        await recordActivity();

        setStatus("success");
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        console.error("Signup error:", err);
        setStatus("error");
        error(
          (err as Error)?.message || i18next.t("signup-wallets.metamask.create-error")
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username, verifiedWallet, validateAccountIsCreated, recordActivity, retryCount]);

  const statusMessages: Record<string, string> = {
    "installing-snap": i18next.t("signup-wallets.metamask.installing-snap"),
    "getting-keys": i18next.t("signup-wallets.metamask.getting-keys"),
    "creating": i18next.t("signup-wallets.create-account.creating"),
    "validating": i18next.t("signup-wallets.create-account.validating"),
    "success": i18next.t("signup-wallets.create-account.success"),
    "error": i18next.t("signup-wallets.metamask.create-error")
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="max-w-[440px] w-full my-4 md:my-8 xl:my-12 mx-auto flex flex-col gap-4">
        <AnimatePresence mode="wait">
          {status !== "success" && status !== "logging-in" && status !== "error" && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col"
            >
              <UilSpinner className="animate-spin duration-500 opacity-50 w-16 h-16" />
              <div className="text-xl font-semibold mt-4">
                {statusMessages[status]}
              </div>
            </motion.div>
          )}

          {status === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col"
            >
              <UilCheckCircle className="w-16 h-16 text-green" />
              <div className="text-xl text-center font-semibold my-4">
                {statusMessages.success}
              </div>
              <p className="text-sm opacity-60 text-center mb-4">
                {i18next.t("signup-wallets.metamask.success-hint")}
              </p>
              <Button
                size="lg"
                onClick={async () => {
                  setStatus("logging-in");
                  try {
                    await loginByMetaMask();
                  } catch {
                    setStatus("success");
                  }
                }}
              >
                {i18next.t("signup-wallets.metamask.login-with-metamask")}
              </Button>
            </motion.div>
          )}

          {status === "logging-in" && (
            <motion.div
              key="logging-in"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col"
            >
              <UilSpinner className="animate-spin duration-500 opacity-50 w-16 h-16" />
              <div className="text-xl font-semibold mt-4">
                {i18next.t("signup-wallets.metamask.logging-in")}
              </div>
            </motion.div>
          )}

          {status === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col"
            >
              <div className="text-xl text-center font-semibold my-4 text-red">
                {statusMessages.error}
              </div>
              <Button
                size="lg"
                onClick={() => {
                  hasInitiatedRef.current = false;
                  setStatus("installing-snap");
                  setRetryCount((c) => c + 1);
                }}
              >
                {i18next.t("g.try-again")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
