import { FormControl } from "@/features/ui";
import { SignupWalletLabeledField } from "./signup-wallet-labeled-field";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useDebounce } from "react-use";
import i18next from "i18next";
import { useQuery } from "@tanstack/react-query";
import { checkUsernameWalletsPendingQueryOptions, getAccountsQueryOptions } from "@ecency/sdk";

interface Props {
  initialUsername: string;
  onAvailableUsername: (value: string) => void;
}

export function SignupWalletChooseUsername({ initialUsername, onAvailableUsername }: Props) {
  const [usernameInput, setUsernameInput] = useState(initialUsername);
  const [username, setUsername] = useState("");
  const [hasTouched, setHasTouched] = useState(false);

  const {
    data: foundAccounts,
    isSuccess,
    isPending
  } = useQuery(getAccountsQueryOptions([username.toLowerCase()]));
  const { data } = useQuery(checkUsernameWalletsPendingQueryOptions(username.toLowerCase()));

  const existingAccount = useMemo(() => foundAccounts?.[0], [foundAccounts]);
  const usernameError = useMemo(() => {
    if (!hasTouched) {
      return;
    }

    if (existingAccount || (data as any)?.exist === true) {
      return i18next.t("sign-up.username-in-use");
    }

    if (username.length < 2) {
      return i18next.t("sign-up.username-max-length-error");
    } else if (username.length > 16) {
      return i18next.t("sign-up.username-min-length-error");
    } else {
      const parts = username.split(".");
      for (const item of parts) {
        if (item.length < 3) {
          return i18next.t("sign-up.username-min-length-error");
        } else if (!/^[\x00-\x7F]*$/.test(item[0])) {
          return i18next.t("sign-up.username-no-ascii-first-letter-error");
        } else if (!/^([a-zA-Z0-9]|-|\.)+$/.test(item)) {
          return i18next.t("sign-up.username-contains-symbols-error");
        } else if (item.includes("--")) {
          return i18next.t("sign-up.username-contains-double-hyphens");
        } else if (/^\d/.test(item)) {
          return i18next.t("sign-up.username-starts-number");
        }
      }
    }
  }, [existingAccount, username, hasTouched, data]);
  const canCreateAccount = useMemo(
    () => !usernameError && username && isSuccess,
    [usernameError, username, isSuccess]
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
        onChange={(e) => setUsernameInput(e.target.value.toLowerCase())}
        onFocus={() => setHasTouched(true)}
      />

      <AnimatePresence>
        {usernameError && !isPending && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-sm px-4 text-red"
          >
            {usernameError}
          </motion.div>
        )}
        {canCreateAccount && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-sm px-4 text-green"
          >
            {i18next.t("signup-wallets.intro.available")}
          </motion.div>
        )}
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="text-sm px-4 text-gray-400 dark:text-gray-600"
          >
            {i18next.t("signup-wallets.intro.checking")}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
