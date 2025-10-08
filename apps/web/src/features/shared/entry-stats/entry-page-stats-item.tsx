import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  count: ReactNode;
  label: ReactNode;
}

export function EntryPageStatsItem({ count, label }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.875 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
      className="flex flex-col items-center gap-1"
    >
      <div className="text-xl lg:text-2xl text-blue-dark-sky">{count}</div>
      <div>{label}</div>
    </motion.div>
  );
}
