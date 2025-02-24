"use client";

import { ExternalWalletCurrency } from "@/enums";
import { success } from "@/features/shared";
import { Button, FormControl, InputGroup } from "@/features/ui";
import { UilCopy, UilEye } from "@tooni/iconscout-unicons-react";
import Image from "next/image";
import { useCallback, useMemo, useState } from "react";
import { useCopyToClipboard } from "react-use";
import { useSignpupWallet } from "../../_hooks";
import { CURRENCIES_META_DATA } from "../../consts";
import { SignupExternalWalletInformation } from "../../types";
import { motion } from "framer-motion";

interface Props {
  i: number;
  currency: ExternalWalletCurrency;
  onSuccess: (walletInformation: SignupExternalWalletInformation) => void;
}

export function SignupWalletConnectWalletItem({ i, currency, onSuccess }: Props) {
  const { createWallet, importWallet } = useSignpupWallet(currency);

  const [_, copy] = useCopyToClipboard();

  const createWalletButtonText = useMemo(() => {
    if (createWallet.isPending) {
      return "Creating...";
    }

    if (createWallet.isSuccess) {
      return "Created";
    }

    return "Create wallet";
  }, [createWallet.isPending, createWallet.isSuccess]);

  const [hasPrivateKeyRevealed, setHasPrivateKeyRevealed] = useState(false);

  const privateKey = useMemo(
    () => (hasPrivateKeyRevealed ? createWallet.data?.privateKey : "************************"),
    [createWallet.data, hasPrivateKeyRevealed]
  );

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
          <div className="flex flex-col gap-2">
            <div className="text-sm px-2 opacity-75 font-semibold">Address</div>
            <InputGroup
              append={
                <Button
                  appearance="gray-link"
                  icon={<UilCopy />}
                  onClick={() => {
                    copy(createWallet.data?.address);
                    success("Copied!");
                  }}
                />
              }
            >
              <FormControl type="text" readOnly={true} value={createWallet.data?.address} />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm px-2 opacity-75 font-semibold">Public key</div>
            <InputGroup
              append={
                <Button
                  appearance="gray-link"
                  icon={<UilCopy />}
                  onClick={() => {
                    copy(createWallet.data?.publicKey);
                    success("Public key has copied");
                  }}
                />
              }
            >
              <FormControl type="text" readOnly={true} value={createWallet.data?.publicKey} />
            </InputGroup>
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-sm px-2 opacity-75 font-semibold">Private key</div>
            <InputGroup
              append={
                !hasPrivateKeyRevealed && (
                  <Button
                    appearance="gray-link"
                    icon={<UilEye />}
                    onClick={() => setHasPrivateKeyRevealed(true)}
                  />
                )
              }
            >
              <FormControl type="text" readOnly={true} value={privateKey} />
            </InputGroup>
          </div>
        </div>
      )}
    </motion.div>
  );
}
