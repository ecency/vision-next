import { Alert, Button } from "@/features/ui";
import { useHiveKeysCreate } from "@ecency/wallets";
import { UilDownloadAlt } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useDownloadKeys } from "../../_hooks";
import { SignupWalletPrivateKeyField } from "./signup-wallet-private-key-field";

interface Props {
  username: string;
}

export function SignupWalletAccountCreating({ username }: Props) {
  const { data: accountKeys, mutateAsync: getAccountKeys, isPending } = useHiveKeysCreate(username);
  const downloadKeys = useDownloadKeys(username, accountKeys);
  // const { mutateAsync: createAccount } = useCreateAccount(username, "address");

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="text-lg font-semibold">Create an account</div>
        <div className="opacity-50">
          Get your own account in Hive blockchain system with 0.0 fee
        </div>
      </div>

      <div className="max-w-[440px] w-full my-4 md:my-8 xl:my-12 mx-auto flex flex-col gap-4">
        <AnimatePresence>
          {accountKeys && (
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
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
