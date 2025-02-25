import { ExternalWalletCurrency } from "@/enums";
import { success } from "@/features/shared";
import { Button } from "@/features/ui";
import { UilClipboardAlt } from "@tooni/iconscout-unicons-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import Image from "next/image";
import { useCopyToClipboard } from "react-use";
import { CURRENCIES_META_DATA } from "../../consts";

interface Props {
  i: number;
  currency: ExternalWalletCurrency;
  address: string;
  selectable?: boolean;
  onSelect: () => void;
}

export function SignupWalletValidationItem({
  i,
  currency,
  address,
  onSelect,
  selectable = false
}: Props) {
  const [_, copy] = useCopyToClipboard();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, position: "absolute" }}
      animate={{ opacity: 1, y: 0, position: "static" }}
      exit={{ opacity: 0, y: 24, position: "absolute" }}
      transition={{ delay: i * 0.1 }}
      className={clsx(
        "w-full cursor-pointer bg-gray-100 dark:bg-dark-default p-4 rounded-xl",
        selectable && "hover:bg-gray-200 hover:dark:bg-gray-800"
      )}
      onClick={onSelect}
    >
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
          copy(address);
          success("Address copied");
        }}
      >
        <div className="opacity-75 text-sm truncate">{address}</div>
        <Button icon={<UilClipboardAlt />} appearance="gray-link" size="xxs" />
      </div>
    </motion.div>
  );
}
