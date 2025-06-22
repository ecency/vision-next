"use client";

import { BoostDialog, LoginRequired, PurchaseQrDialog } from "@/features/shared";
import { motion } from "framer-motion";
import i18next from "i18next";
import Image from "next/image";
import { useState } from "react";
import {
  PerksBasicCard,
  PerksPointsCard,
  PerksPointsSpinBanner,
  PerksPromoteCard
} from "./components";

export function PerksPage() {
  const [showBoost, setShowBoost] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);

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
        className="col-span-6 row-span-2 md:col-span-3"
      >
        <LoginRequired>
          <PerksBasicCard
            className="md:text-lg font-bold min-h-[13rem] cursor-pointer"
            onClick={() => setShowQrDialog(true)}
          >
            <div className="p-4 text-blue-dark-sky relative z-10">
              {i18next.t("perks.account-boost-title")}
            </div>
            <Image
              className="absolute -bottom-8"
              src="/assets/undraw-power.svg"
              width={320}
              height={240}
              alt=""
            />
          </PerksBasicCard>
        </LoginRequired>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="col-span-6 row-span-2 md:col-span-3"
      >
        <LoginRequired>
          <PerksBasicCard
            className="min-h-[13rem] cursor-pointer p-4"
            onClick={() => setShowBoost(true)}
          >
            <div className="md:text-lg font-bold">{i18next.t("perks.boost-plus-title")}</div>
            <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
              {i18next.t("perks.boost-plus-description")}
            </div>
          </PerksBasicCard>
        </LoginRequired>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="col-span-12 row-span-1"
      >
        <LoginRequired>
          <PerksPointsSpinBanner />
        </LoginRequired>
      </motion.div>
      {showBoost && <BoostDialog onHide={() => setShowBoost(false)} />}
      <PurchaseQrDialog show={showQrDialog} setShow={(v) => setShowQrDialog(v)} />
    </div>
  );
}
