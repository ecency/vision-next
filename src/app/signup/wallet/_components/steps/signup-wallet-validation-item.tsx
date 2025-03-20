import { success } from "@/features/shared";
import { Button } from "@/features/ui";
import { UilClipboardAlt } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCopyToClipboard, useMount } from "react-use";
import { CURRENCIES_META_DATA } from "../../consts";
import {
  EcencyCreateWalletInformation,
  EcencyWalletCurrency,
  useWalletCreate
} from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import i18next from "i18next";

interface Props {
  i: number;
  username: string;
  currency: EcencyWalletCurrency;
  selectable?: boolean;
  onSelect: (wallet: EcencyCreateWalletInformation) => void;
}

export function SignupWalletValidationItem({
  i,
  username,
  currency,
  onSelect,
  selectable = false
}: Props) {
  const [_, copy] = useCopyToClipboard();
  const { data: wallets } = useQuery<Map<EcencyWalletCurrency, EcencyCreateWalletInformation>>({
    queryKey: ["ecency-wallets", "wallets", username]
  });
  const wallet = useMemo(() => wallets?.get(currency), [wallets, currency]);

  const { createWallet } = useWalletCreate(username, currency);

  useMount(() => {
    if (!wallet) {
      createWallet.mutateAsync();
    }
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, position: "absolute" }}
      animate={{ opacity: 1, y: 0, position: "relative" }}
      transition={{ delay: i * 0.1 }}
      className={clsx(
        "w-full cursor-pointer bg-gray-100 dark:bg-dark-default p-4 rounded-xl overflow-hidden",
        selectable && "hover:bg-gray-200 hover:dark:bg-gray-800"
      )}
      onClick={() => onSelect(wallet!)}
    >
      {wallet?.custom === true && (
        <div className="text-[0.5rem] font-bold z-10 text-blue-dark-sky uppercase p-1 rounded-bl-xl bg-blue-dark-sky bg-opacity-20 top-0 right-0 absolute">
          Imported
        </div>
      )}
      <div className="flex justify-between">
        <Image
          src={CURRENCIES_META_DATA[currency].icon}
          width={32}
          height={32}
          alt=""
          className="max-h-8"
        />
        <div className="text-sm font-semibold opacity-50">
          {CURRENCIES_META_DATA[currency].name}
        </div>
      </div>

      <div
        className="flex items-center gap-1 mt-6 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          copy(wallet?.address ?? "");
          success(i18next.t("signup-wallets.validate-funds.address-copied"));
        }}
      >
        <div className="opacity-75 text-sm truncate">{wallet?.address}</div>
        <Button icon={<UilClipboardAlt />} noPadding={true} appearance="gray-link" size="xxs" />
      </div>
    </motion.div>
  );
}
