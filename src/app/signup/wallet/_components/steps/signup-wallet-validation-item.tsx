import { ExternalWalletCurrency } from "@/enums";
import { motion } from "framer-motion";
import Image from "next/image";
import { CURRENCIES_META_DATA } from "../../consts";

interface Props {
  i: number;
  currency: ExternalWalletCurrency;
  address: string;
  onSelect: () => void;
}

export function SignupWalletValidationItem({ i, currency, address, onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      whileHover={{ scale: 1.1 }}
      transition={{ delay: i * 0.1 }}
      className="cursor-pointer bg-gray-100 dark:bg-dark-default p-4 rounded-xl"
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
