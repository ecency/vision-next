import { useHiveKeysCreate } from "@ecency/wallets";
import { getAccountsQuery } from "@/api/queries";
import { Alert, Button, FormControl } from "@/features/ui";
import { UilDownloadAlt } from "@tooni/iconscout-unicons-react";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useDebounce } from "react-use";
import { useDownloadKeys } from "../../_hooks";
import { SignupWalletLabeledField } from "./signup-wallet-labeled-field";
import { SignupWalletPrivateKeyField } from "./signup-wallet-private-key-field";

export function SignupWalletAccountCreating() {
  const [usernameInput, setUsernameInput] = useState("");
  const [username, setUsername] = useState("");

  const { data: foundAccounts, isSuccess } = getAccountsQuery([username]).useClientQuery();

  const { data: accountKeys, mutateAsync: getAccountKeys, isPending } = useHiveKeysCreate(username);
  const downloadKeys = useDownloadKeys(username, accountKeys);
  // const { mutateAsync: createAccount } = useCreateAccount(username, "address");

  const existingAccount = useMemo(() => foundAccounts?.[0], [foundAccounts]);
  const isInvalidUsername = useMemo(
    () => existingAccount && !accountKeys,
    [existingAccount, accountKeys]
  );
  const isInvalidUsernameLength = useMemo(
    () => (usernameInput.length <= 2 && usernameInput.length > 0) || usernameInput.length > 16,
    [usernameInput.length]
  );
  const canCreateAccount = useMemo(
    () => !isInvalidUsername && !isInvalidUsernameLength && username && isSuccess && !accountKeys,
    [isInvalidUsername, isInvalidUsernameLength, username, isSuccess, accountKeys]
  );

  useDebounce(() => setUsername(usernameInput), 500, [usernameInput]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <div className="text-lg font-semibold">Create an account</div>
        <div className="opacity-50">
          Get your own account in Hive blockchain system with 0.0 fee
        </div>
      </div>

      <div className="max-w-[440px] w-full my-4 md:my-8 xl:my-12 mx-auto flex flex-col gap-4">
        <SignupWalletLabeledField label="Username">
          <FormControl
            aria-invalid={!!existingAccount}
            type="text"
            disabled={!!accountKeys}
            placeholder="Set your Hive username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
          />
        </SignupWalletLabeledField>

        <AnimatePresence>
          {isInvalidUsername && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-sm px-4 -mt-2 text-red"
            >
              This username already exists. Set another one
            </motion.div>
          )}
          {isInvalidUsernameLength && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-sm px-4 -mt-2 text-red"
            >
              Username length should be between 2 and 16 symbols
            </motion.div>
          )}
          {canCreateAccount && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="text-sm px-4 -mt-2 text-green"
            >
              This username is available to use
            </motion.div>
          )}
          {canCreateAccount && (
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ delay: 0.2 }}
              className="my-4 md:my-8 w-full"
            >
              <Button
                isLoading={isPending}
                full={true}
                size="lg"
                onClick={() => !accountKeys && getAccountKeys()}
              >
                Continue
              </Button>
            </motion.div>
          )}
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
