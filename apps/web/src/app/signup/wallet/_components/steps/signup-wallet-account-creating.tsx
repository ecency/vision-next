import { getQueryClient } from "@/core/react-query";
import { useLoginByKey } from "@/features/shared/login/hooks";
import { Button } from "@/features/ui";
import { delay } from "@/utils";
import { EcencyAnalytics, getAccountFullQueryOptions } from "@ecency/sdk";
import type { FullAccount as FullAccountEntity } from "@/entities";
import {
  EcencyWalletCurrency,
  EcencyWalletsPrivateApi,
  useHiveKeysQuery,
  useSaveWalletInformationToMetadata,
  useSeedPhrase,
  useWalletsCacheQuery
} from "@ecency/wallets";
import { UilCheckCircle, UilSpinner } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  username: string;
  validatedWallet: EcencyWalletCurrency;
}

export function SignupWalletAccountCreating({ username, validatedWallet }: Props) {
  const params = useSearchParams();

  const [hasValidated, setHasValidated] = useState(false);
  const hasInitiatedRef = useRef(false);

  const { data: seed } = useSeedPhrase(username);
  const { data: hiveKeys } = useHiveKeysQuery(username);
  const loginKey = useMemo(
    () => hiveKeys?.posting ?? hiveKeys?.active ?? seed ?? "",
    [hiveKeys, seed]
  );
  const { data: wallets } = useWalletsCacheQuery(username);
  const wallet = useMemo(() => wallets?.get(validatedWallet), [wallets, validatedWallet]);

  const { mutateAsync: loginByKey } = useLoginByKey(username, loginKey, true);
  const { mutateAsync: createAccount, isSuccess: isAccountCreateScheduled } =
    EcencyWalletsPrivateApi.useCreateAccountWithWallets(username);
  const { mutateAsync: saveWalletInformationToMetadata } =
    useSaveWalletInformationToMetadata(username, {
      postingKey: loginKey
    });
  const { mutateAsync: recordActivity } = EcencyAnalytics.useRecordActivity(
    username,
    "signed-up-with-wallets"
  );

  const validateAccountIsCreated = useCallback(
    async (shouldStop?: () => boolean): Promise<FullAccountEntity> => {
      const accountQueryOptions = getAccountFullQueryOptions(username);
      const queryClient = getQueryClient();

      // Poll until the account is available on-chain.
      // Return the fetched account so the login mutation can reuse it and avoid
      // hitting a different RPC node that might not yet be in sync.
      while (!shouldStop?.()) {
        try {
          const account = await accountQueryOptions.queryFn();

          if (account) {
            queryClient.setQueryData(accountQueryOptions.queryKey, account);
            setHasValidated(true);
            return account as unknown as FullAccountEntity;
          }
        } catch (e) {
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
    if (
      !(
        seed &&
        hiveKeys &&
        wallet?.currency &&
        wallet.address &&
        loginKey &&
        !hasInitiatedRef.current
      )
    ) {
      return;
    }

    hasInitiatedRef.current = true;

    let cancelled = false;
    const shouldStop = () => cancelled;

    (async () => {
      try {
        await createAccount({ currency: wallet.currency!, address: wallet.address! });
        await delay(5000);
        const account = await validateAccountIsCreated(shouldStop);
        if (shouldStop()) {
          return;
        }

        await loginByKey(account);
        if (shouldStop()) {
          return;
        }

        await saveWalletInformationToMetadata(Array.from(wallets?.values() ?? []));
        if (shouldStop()) {
          return;
        }

        await recordActivity();
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          return;
        }

        /* Errors are handled within respective mutation hooks */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    seed,
    hiveKeys,
    wallet,
    createAccount,
    loginByKey,
    validateAccountIsCreated,
    saveWalletInformationToMetadata,
    wallets,
    recordActivity,
    loginKey
  ]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="max-w-[440px] w-full my-4 md:my-8 xl:my-12 mx-auto flex flex-col gap-4">
        <AnimatePresence>
          {!isAccountCreateScheduled && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col"
            >
              <UilSpinner className="animate-spin duration-500 opacity-50 w-16 h-16" />
              <div className="text-xl font-semibold mt-4">
                {i18next.t("signup-wallets.create-account.creating")}
              </div>
            </motion.div>
          )}
          {!hasValidated && isAccountCreateScheduled && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col"
            >
              <UilSpinner className="animate-spin duration-500 opacity-50 w-16 h-16" />
              <div className="text-xl font-semibold mt-4">
                {i18next.t("signup-wallets.create-account.validating")}
              </div>
            </motion.div>
          )}
          {isAccountCreateScheduled && hasValidated && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col"
            >
              <UilCheckCircle className="w-16 h-16 text-green" />
              <div className="text-xl text-center font-semibold my-4">
                {i18next.t("signup-wallets.create-account.success")}
              </div>
              <Link href={params?.get("backUri") ?? "/"}>
                <Button size="lg">
                  {params?.has("backUri") ? "Back to origin" : "Explore Ecency"}
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
