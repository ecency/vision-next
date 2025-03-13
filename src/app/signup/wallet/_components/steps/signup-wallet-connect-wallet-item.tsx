"use client";

import { Button } from "@/features/ui";
import { EcencyWalletCurrency, useWalletCreate } from "@ecency/wallets";
import { motion } from "framer-motion";
import i18next from "i18next";
import Image from "next/image";
import { useCallback } from "react";
import { useMount } from "react-use";
import { CURRENCIES_META_DATA } from "../../consts";
import { SignupExternalWalletInformation } from "../../types";

interface Props {
  i: number;
  username: string;
  currency: EcencyWalletCurrency;
  onSuccess: (walletInformation: SignupExternalWalletInformation) => void;
}

export function SignupWalletConnectWalletItem({ i, currency, username, onSuccess }: Props) {
  const { createWallet, importWallet } = useWalletCreate(username, currency);

  const create = useCallback(async () => {
    if (createWallet.isIdle) {
      const response = await createWallet.mutateAsync();
      onSuccess(response);
    }
  }, [createWallet, onSuccess]);

  useMount(() => {
    create();
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      transition={{ delay: i * 0.1 }}
      className="bg-gray-100 dark:bg-dark-600-010 p-4 rounded-xl flex flex-col gap-4"
      key={currency}
    >
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
          <Image
            className="w-[2rem] h-[2rem]"
            src={CURRENCIES_META_DATA[currency].icon.src}
            width={CURRENCIES_META_DATA[currency].icon.width}
            height={CURRENCIES_META_DATA[currency].icon.height}
            alt={CURRENCIES_META_DATA[currency].title}
          />
          <div className="font-semibold">{CURRENCIES_META_DATA[currency].title}</div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            disabled={true}
            size="sm"
            appearance="gray"
            onClick={() => importWallet(currency)}
          >
            {i18next.t("g.import")}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
