"use client";

import { Button, FormControl } from "@/features/ui";
import { EcencyWalletCurrency, useWalletCreate } from "@ecency/wallets";
import { motion } from "framer-motion";
import i18next from "i18next";
import Image from "next/image";
import { useCallback } from "react";
import { useMount } from "react-use";
import { CURRENCIES_META_DATA } from "../../consts";
import { SignupExternalWalletInformation } from "../../types";
import clsx from "clsx";

interface Props {
  i: number;
  hasSelected: boolean;
  username: string;
  currency: EcencyWalletCurrency;
  onSuccess: (walletInformation: SignupExternalWalletInformation) => void;
  onClear: () => void;
}

export function SignupWalletConnectWalletItem({
  i,
  currency,
  username,
  onSuccess,
  onClear,
  hasSelected
}: Props) {
  const { createWallet, importWallet } = useWalletCreate(username, currency);

  useMount(async () => {
    const response = await createWallet.mutateAsync();
    onSuccess(response);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ delay: i * 0.1 }}
      className="bg-gray-100 dark:bg-dark-600-010 p-4 rounded-xl flex flex-col gap-4 cursor-pointer border border-transparent hover:border-[--border-color]"
      onClick={() => (hasSelected ? onClear() : onSuccess(createWallet.data!))}
      key={currency}
    >
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <FormControl
            checked={hasSelected}
            type="checkbox"
            onChange={() => (hasSelected ? onClear() : onSuccess(createWallet.data!))}
          />
          <Image
            className={clsx("w-[2rem] h-[2rem]", !hasSelected && "opacity-25")}
            src={CURRENCIES_META_DATA[currency].icon.src}
            width={CURRENCIES_META_DATA[currency].icon.width}
            height={CURRENCIES_META_DATA[currency].icon.height}
            alt={CURRENCIES_META_DATA[currency].title}
          />
          <div className={clsx("font-semibold", !hasSelected && "opacity-25")}>
            {CURRENCIES_META_DATA[currency].title}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
