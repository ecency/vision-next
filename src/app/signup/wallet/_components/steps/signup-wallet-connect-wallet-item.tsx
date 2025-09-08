"use client";

import { FormControl } from "@/features/ui";
import {
  EcencyTokenMetadata,
  EcencyWalletCurrency,
  useWalletCreate
} from "@ecency/wallets";
import { motion } from "framer-motion";
import Image from "next/image";
import { useMemo } from "react";
import { useMount } from "react-use";
import { CURRENCIES_META_DATA } from "../../consts";
import { SignupExternalWalletInformation } from "../../types";
import clsx from "clsx";
import { useQuery } from "@tanstack/react-query";

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
  const { data: wallets } = useQuery<Map<EcencyWalletCurrency, EcencyTokenMetadata>>({
    queryKey: ["ecency-wallets", "wallets", username]
  });
  const { createWallet } = useWalletCreate(username, currency);

  const wallet = useMemo(() => wallets?.get(currency), [wallets]);

  const walletInfo = useMemo<SignupExternalWalletInformation | undefined>(() => {
    const data = createWallet.data;
    if (!data?.address || !data?.privateKey || !data?.publicKey) {
      return undefined;
    }
    return {
      address: data.address,
      privateKey: data.privateKey,
      publicKey: data.publicKey
    };
  }, [createWallet.data]);

  useMount(async () => {
    const response = await createWallet.mutateAsync();
    if (response.address && response.privateKey && response.publicKey) {
      onSuccess({
        address: response.address,
        privateKey: response.privateKey,
        publicKey: response.publicKey
      });
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
        transition={{ delay: i * 0.1 }}
        className="bg-gray-100 dark:bg-dark-600-010 p-4 rounded-xl flex flex-col gap-4 cursor-pointer border border-transparent hover:border-[--border-color] relative overflow-hidden"
        onClick={() => (hasSelected ? onClear() : walletInfo && onSuccess(walletInfo))}
        key={currency}
      >
      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-4">
            <FormControl
              checked={hasSelected}
              type="checkbox"
              onChange={() => (hasSelected ? onClear() : walletInfo && onSuccess(walletInfo))}
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

            {wallet?.custom && (
              <div className="text-xs text-blue-dark-sky uppercase p-1.5 rounded-bl-xl bg-blue-dark-sky bg-opacity-10 absolute top-0 right-0">
                Imported
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
