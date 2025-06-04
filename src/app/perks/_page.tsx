"use client";

import i18next from "i18next";
import { PerksPointsCard, PerksPromoteCard } from "./components";
import { motion } from "framer-motion";

export function PerksPage() {
  return (
    <div className="grid grid-cols-12 grid-rows-4 gap-4">
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        className="col-span-12 sm:col-span-6 row-span-4 md:col-span-5"
      >
        <PerksPointsCard />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="col-span-12 sm:col-span-6 row-span-4 md:col-span-4"
      >
        <PerksPromoteCard />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="col-span-12 sm:col-span-6 row-span-2 md:col-span-3"
      >
        <div className="bg-white dark:bg-gray-900 w-full h-full rounded-xl">
          <div>{i18next.t("perks.account-boost-title")}</div>
        </div>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="col-span-12 sm:col-span-6 row-span-2 md:col-span-3"
      >
        <div className="bg-white dark:bg-gray-900 w-full h-full rounded-xl">Promote post</div>
      </motion.div>
    </div>
  );
}
