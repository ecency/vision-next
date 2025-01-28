"use client";

import { classNameObject } from "@ui/util";
import { motion } from "framer-motion";

interface Props {
  isSelected?: boolean;
  name: string;
  onSelect: () => void;
  title: string;
  i: number;
}

export function TabItem({ isSelected = false, name, onSelect, title, i }: Props) {
  return (
    <motion.div
      className={classNameObject({
        " py-4 px-2 lg:px-3 xl:px-4 flex flex-col items-center relative cursor-pointer": true,
        "text-blue-dark-sky": isSelected
      })}
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: i * 0.2 }}
      key={name}
      onClick={onSelect}
    >
      {title}
      {isSelected && (
        <motion.span
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-full absolute w-1 h-1 bottom-2 bg-blue-dark-sky"
        />
      )}
    </motion.div>
  );
}
