import { useLoginByKey, useLoginInApp } from "@/features/shared/login/hooks";
import { Button } from "@/features/ui";
import {
  EcencyWalletCurrency,
  EcencyWalletsPrivateApi,
  useHiveKeysQuery,
  useSeedPhrase
} from "@ecency/wallets";
import { UilCheckCircle, UilSpinner } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

interface Props {
  username: string;
  validatedWallet: { currency: EcencyWalletCurrency; address: string };
  onCreated: () => void;
}

export function SignupWalletAccountCreating({
  username,
  validatedWallet: { currency, address },
  onCreated
}: Props) {
  const { data: seed } = useSeedPhrase();
  const { data: accountKeys } = useHiveKeysQuery(username);
  const { mutateAsync: loginInApp } = useLoginByKey(username, seed!, true);

  const { mutateAsync: createAccount, isSuccess: isAccountCreateScheduled } =
    EcencyWalletsPrivateApi.useCreateAccountWithWallets(username);

  const params = useSearchParams();

  useEffect(() => {
    if (accountKeys) {
      createAccount({ currency, address })
        .then(() => loginInApp())
        .then(() => onCreated());
    }
  }, [accountKeys, address, createAccount, currency]);

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
              <div className="text-xl font-semibold mt-4">Creating Hive account...</div>
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
