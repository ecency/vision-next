"use client";

import { motion } from "framer-motion";
import { PropsWithChildren } from "react";

export function CommunityCardAnimated(props: PropsWithChildren<{ i: number; className?: string }>) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        left: -16,
        scale: 0.95
      }}
      animate={{
        opacity: 1,
        left: 0,
        scale: 1
      }}
      exit={{
        opacity: 0,
        left: -16,
        scale: 0.95
      }}
      transition={{
        delay: 0.1 * props.i
      }}
      className={props.className}
    >
      {props.children}
    </motion.article>
  );
}
