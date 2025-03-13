import { FormControl } from "@/features/ui";
import { SignupWalletLabeledField } from "./signup-wallet-labeled-field";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { getAccountsQuery } from "@/api/queries";
import { useDebounce } from "react-use";

interface Props {
  initialUsername: string;
  onAvailableUsername: (value: string) => void;
}

export function SignupWalletChooseUsername({ initialUsername, onAvailableUsername }: Props) {
  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [username, setUsername] = useState("");

  const {
    data: foundAccounts,
    isSuccess,
    isPending
  } = getAccountsQuery([username]).useClientQuery();

  const existingAccount = useMemo(() => foundAccounts?.[0], [foundAccounts]);
  const isInvalidUsername = useMemo(() => existingAccount, [existingAccount]);
  const isInvalidUsernameLength = useMemo(
    () => (usernameInput.length <= 2 && usernameInput.length > 0) || usernameInput.length > 16,
    [usernameInput.length]
  );
  const canCreateAccount = useMemo(
    () => !isInvalidUsername && !isInvalidUsernameLength && username && isSuccess,
    [isInvalidUsername, isInvalidUsernameLength, username, isSuccess]
  );

  useDebounce(() => setUsername(usernameInput), 500, [usernameInput]);

  useEffect(() => {
    if (canCreateAccount) {
      onAvailableUsername(username);
    } else {
      onAvailableUsername("");
    }
  }, [canCreateAccount, onAvailableUsername, username]);

  return (
    <div className="py-4">
      <FormControl
        aria-invalid={!!existingAccount}
        type="text"
        placeholder="Set your Hive username"
        value={usernameInput}
        onChange={(e) => setUsernameInput(e.target.value)}
      />

      <AnimatePresence>
        {isInvalidUsername && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-sm px-4 text-red"
          >
            This username already exists. Set another one
          </motion.div>
        )}
        {isInvalidUsernameLength && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-sm px-4 text-red"
          >
            Username length should be between 2 and 16 symbols
          </motion.div>
        )}
        {canCreateAccount && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-sm px-4 text-green"
          >
            This username is available to use
          </motion.div>
        )}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-sm px-4 text-gray-400 dark:text-gray-600"
          >
            Checking username for availability...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
