import { getAccount } from "@/api/hive";
import { useUpdateProfile } from "@/api/mutations";
import { useLoginByKey, useLoginInApp } from "@/features/shared/login/hooks";
import { Button } from "@/features/ui";
import { delay } from "@/utils";
import {
  EcencyCreateWalletInformation,
  EcencyWalletCurrency,
  EcencyWalletsPrivateApi,
  useHiveKeysQuery,
  useSeedPhrase
} from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import { UilCheckCircle, UilSpinner } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import i18next from "i18next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface Props {
  username: string;
  validatedWallet: EcencyWalletCurrency;
  onCreated: () => void;
}

export function SignupWalletAccountCreating({ username, validatedWallet, onCreated }: Props) {
  const params = useSearchParams();

  const [hasValidated, setHasValidated] = useState(false);

  const { data: seed } = useSeedPhrase(username);
  const { data: accountKeys } = useHiveKeysQuery(username);
  const { data: wallets } = useQuery<Map<EcencyWalletCurrency, EcencyCreateWalletInformation>>({
    queryKey: ["ecency-wallets", "wallets", username]
  });
  const wallet = useMemo(() => wallets?.get(validatedWallet), [wallets, validatedWallet]);

  const { mutateAsync: loginInApp } = useLoginByKey(username, seed!, true);
  const {
    mutateAsync: createAccount,
    isSuccess: isAccountCreateScheduled,
    isPending
  } = EcencyWalletsPrivateApi.useCreateAccountWithWallets(username);

  const validateAccountIsCreated = useCallback(async () => {
    let account;
    while (!account) {
      await delay(5000);
      account = await getAccount(username);
    }

    setHasValidated(true);
  }, [username]);

  useEffect(() => {
    if (accountKeys && wallet && !isPending) {
      createAccount({ currency: wallet.currency, address: wallet.address })
        .then(() => validateAccountIsCreated())
        .then(() => loginInApp())
        .then(() => onCreated());
    }
  }, [
    accountKeys,
    wallet,
    createAccount,
    loginInApp,
    onCreated,
    isPending,
    validateAccountIsCreated
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
          {!hasValidated && (
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
          {isAccountCreateScheduled && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex items-center flex-col"
            >
              <UilCheckCircle className="w-16 h-16 text-green" />
              <div className="text-xl text-center font-semibold my-4">
                Your account has created. Enjoy with Hive!
              </div>
              <Link href={params.get("backUri") ?? "/"}>
                <Button size="lg">
                  {params.has("backUri") ? "Back to origin" : "Explore Ecency"}
                </Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
