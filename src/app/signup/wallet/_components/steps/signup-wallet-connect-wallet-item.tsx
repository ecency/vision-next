"use client";

import { Button, InputGroupCopyClipboard } from "@/features/ui";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useMemo } from "react";
import { CURRENCIES_META_DATA } from "../../consts";
import { SignupExternalWalletInformation } from "../../types";
import { SignupWalletLabeledField } from "./signup-wallet-labeled-field";
import { SignupWalletPrivateKeyField } from "./signup-wallet-private-key-field";
import { EcencyWalletCurrency, useWalletCreate } from "@ecency/wallets";

interface Props {
  i: number;
  currency: EcencyWalletCurrency;
  onSuccess: (walletInformation: SignupExternalWalletInformation) => void;
}

export function SignupWalletConnectWalletItem({ i, currency, onSuccess }: Props) {
  const { createWallet, importWallet } = useWalletCreate(currency);

  const createWalletButtonText = useMemo(() => {
    if (createWallet.isPending) {
      return "Creating...";
    }

    if (createWallet.isSuccess) {
      return "Created";
    }

    return "Create wallet";
  }, [createWallet]);

  const create = useCallback(async () => {
    if (createWallet.isIdle) {
      const response = await createWallet.mutateAsync();
      onSuccess(response);
    }
  }, [createWallet, onSuccess]);

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
            appearance={createWallet.isSuccess ? "success" : "primary"}
            isLoading={createWallet.isPending}
            disabled={createWallet.isPending}
            size="sm"
            onClick={create}
          >
            {createWalletButtonText}
          </Button>
          <Button
            disabled={true}
            size="sm"
            appearance="gray"
            onClick={() => importWallet(currency)}
          >
            Import
          </Button>
        </div>
      </div>

      {createWallet.isSuccess && (
        <div className="flex flex-col gap-4">
          <SignupWalletLabeledField label="Address">
            <InputGroupCopyClipboard value={createWallet.data?.address} />
          </SignupWalletLabeledField>
          <SignupWalletPrivateKeyField privateKey={createWallet.data?.privateKey} />
        </div>
      )}
    </motion.div>
  );
}
