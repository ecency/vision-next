import { motion } from "framer-motion";
import { PropsWithChildren } from "react";

export function AnimatedNotificationListItemLayout(props: PropsWithChildren<{ index: number }>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 32 }}
      transition={{ delay: props.index * 0.1 }}
    >
      {props.children}
    </motion.div>
  );
}
