"use client";

import { motion } from "framer-motion";
import { PropsWithChildren } from "react";

export function CommunityCardAnimated({
  i,
  className,
  children
}: PropsWithChildren<{ i: number; className?: string }>) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        x: -16,
        scale: 0.95
      }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1
      }}
      exit={{
        opacity: 0,
        x: -16,
        scale: 0.95
      }}
      transition={{
        delay: 0.1 * i
      }}
      className={className}
    >
      {children}
    </motion.article>
  );
}

export default CommunityCardAnimated;
