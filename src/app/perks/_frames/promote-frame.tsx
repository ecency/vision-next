"use client";

import { motion } from "framer-motion";

export function PromoteFrame() {
  return (
    <motion.div className="grid items-end gap-2 grid-cols-6 h-[240px]">
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">jan</div>
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: "10%" }}
          className="bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300"
        >
          +10
        </motion.div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">feb</div>
        <motion.div
          transition={{ delay: 0.1 }}
          initial={{ height: 0 }}
          animate={{ height: "20%" }}
          className="bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300"
        >
          +20
        </motion.div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">mar</div>
        <motion.div
          transition={{ delay: 0.15 }}
          initial={{ height: 0 }}
          animate={{ height: "15%" }}
          className="bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300"
        >
          +15
        </motion.div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">apr</div>
        <motion.div
          transition={{ delay: 0.2 }}
          initial={{ height: 0 }}
          animate={{ height: "25%" }}
          className="bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300"
        >
          +25
        </motion.div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">may</div>
        <motion.div
          transition={{ delay: 0.25 }}
          initial={{ height: 0 }}
          animate={{ height: "35%" }}
          className="bg-gray-200 dark:bg-gray-800 rounded-lg text-xs flex items-center justify-center text-gray-700 dark:text-gray-300"
        >
          +35
        </motion.div>
      </div>
      <div className="flex flex-col-reverse gap-2 h-full">
        <div className="uppercase text-xs text-gray-600 dark:text-gray-400 text-center">jun</div>
        <motion.div
          transition={{ delay: 0.3 }}
          initial={{ height: 0 }}
          animate={{ height: "100%" }}
          className="bg-blue-dark-sky rounded-lg text-xs flex items-center justify-center text-[#ffffff]"
        >
          +120
        </motion.div>
      </div>
    </motion.div>
  );
}
