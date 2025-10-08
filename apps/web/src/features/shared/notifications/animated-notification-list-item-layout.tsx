import { motion } from "framer-motion";
import { PropsWithChildren } from "react";

export function AnimatedNotificationListItemLayout(props: PropsWithChildren<{ index: number }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ delay: Math.min(props.index, 5) * 0.05 }}
    >
      {props.children}
    </motion.div>
  );
}
