import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { classNameObject } from "@ui/util";

interface Props {
  tabs: {
    title: string;
    key: string;
  }[];
  onSelect: (v: string) => void;
}

export function CenterTabs({ tabs, onSelect }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const [current, setCurrent] = useState(tabs[0].key);

  useEffect(() => {
    onSelect(current);
  }, [current, onSelect]);

  return (
    <div
      ref={ref}
      className="border-b border-[--border-color] grid grid-cols-4 items-center text-center text-sm font-semibold"
    >
      {tabs.map((tab, i) => (
        <motion.div
          className={classNameObject({
            "p-2 lg:p-3 xl:p-4 flex flex-col items-center relative cursor-pointer": true,
            "text-blue-dark-sky": current === tab.key
          })}
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.2 }}
          key={tab.key}
          onClick={() => setCurrent(tab.key)}
        >
          {tab.title}
          {tab.key === current && (
            <motion.span
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full absolute w-1 h-1 bottom-2 bg-blue-dark-sky"
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}
