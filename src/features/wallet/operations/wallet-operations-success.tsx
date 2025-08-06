import { UilCheckCircle, UilSpinner } from "@tooni/iconscout-unicons-react";
import { motion } from "framer-motion";
import i18next from "i18next";

export function WalletOperationSuccess() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, height: 0 }}
      className="border-t border-[--border-color] mx-auto max-w-[800px] overflow-hidden"
    >
      <div className="p-4 flex items-center justify-center gap-2">
        <UilCheckCircle className="text-green w-10 h-10" />
        <div>
          <div className="font-bold">{i18next.t("g.success")}</div>
          <div className="opacity-50 text-sm">{i18next.t("transactions.success-hint")}</div>
        </div>
      </div>
    </motion.div>
  );
}
