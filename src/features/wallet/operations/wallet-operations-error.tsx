import { UilTimesCircle } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";

interface Props {
  error?: Error;
}

export function WalletOperationError({ error }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-[--border-color] mx-auto max-w-[800px] overflow-hidden"
    >
      <div className="p-4 flex items-center justify-center gap-2">
        <UilTimesCircle className="text-red w-10 h-10" />
        <div>
          <div className="font-bold">{i18next.t("g.error")}</div>
          <div className="opacity-50 text-sm">{error?.message}</div>
        </div>
      </div>
    </motion.div>
  );
}
