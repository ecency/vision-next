import { useHiveKeysQuery, EcencyWalletsPrivateApi, EcencyWalletCurrency } from "@ecency/wallets";
import { UilCheckCircle, UilSpinner } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDownloadKeys } from "../../_hooks";
import { useEffect } from "react";
import { Button } from "@/features/ui";

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
  const { data: accountKeys } = useHiveKeysQuery(username);
  const downloadKeys = useDownloadKeys(username, accountKeys);

  const { mutateAsync: createAccount, isSuccess: isAccountCreateScheduled } =
    EcencyWalletsPrivateApi.useCreateAccountWithWallets(username);

  useEffect(() => {
    if (accountKeys) {
      createAccount({ currency, address }).then(() => onCreated());
    }
  }, [accountKeys, address, createAccount, currency, onCreated]);

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
              <Button size="lg">Back to origin</Button>
            </motion.div>
          )}
          {/* {accountKeys && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="flex flex-col gap-4 items-center"
            >
              <SignupWalletPrivateKeyField privateKey={accountKeys.masterPassword} />
              <Alert>
                Private and other keys will be shown only once on this page. After closing this page
                You will never be able to see them again. Please download all keys and store in a
                safe place!
              </Alert>
              <Button
                iconPlacement="left"
                icon={<UilDownloadAlt />}
                size="lg"
                onClick={downloadKeys}
              >
                Download all keys & continue
              </Button>
            </motion.div>
          )} */}
        </AnimatePresence>
      </div>
    </div>
  );
}
