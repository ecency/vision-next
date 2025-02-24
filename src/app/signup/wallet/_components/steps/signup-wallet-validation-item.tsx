import { ExternalWalletCurrency } from "@/enums";
import { motion } from "framer-motion";
import Image from "next/image";
import { CURRENCIES_META_DATA } from "../../consts";
import clsx from "clsx";

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
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, position: "absolute" }}
      animate={{ opacity: 1, y: 0, position: "static" }}
      exit={{ opacity: 0, y: 24, position: "absolute" }}
      transition={{ delay: i * 0.1 }}
      className={clsx(
        "cursor-pointer bg-gray-100 dark:bg-dark-default p-4 rounded-xl",
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

      <div className="opacity-75 text-sm mt-6 truncate">{address}</div>
    </motion.div>
  );
}
