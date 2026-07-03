"use client";

import { BoostDialog } from "@/features/shared/boost";
import { LoginRequired } from "@/features/shared/login-required";
import { PurchaseQrDialog } from "@/features/shared/purchase-qr";
import { EcencyConfigManager } from "@/config";
import i18next from "i18next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import * as ls from "@/utils/local-storage";
import { PERKS_SEEN_KEY } from "@/features/shared/navbar/navbar-perks-button";
import {
  PerksBasicCard,
  PerksPointsCard,
  PerksPointsSpinBanner,
  PerksPromoteCard,
  PerksQuestsSection
} from "./components";

export function PerksPage() {
  const [showBoost, setShowBoost] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);

  // Opening the hub clears the one-time discovery dot on the navbar perks button.
  useEffect(() => {
    ls.set(PERKS_SEEN_KEY, true);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <LoginRequired>
        <PerksQuestsSection />
      </LoginRequired>

      <div className="grid grid-cols-12 grid-rows-4 gap-4">
        <div className="col-span-12 sm:col-span-6 row-span-4 md:col-span-5">
          <PerksPointsCard />
        </div>
        <div className="col-span-12 sm:col-span-6 row-span-4 md:col-span-4">
          <PerksPromoteCard />
        </div>
        <div className="col-span-6 row-span-2 md:col-span-3">
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
        </div>
        <div className="col-span-6 row-span-2 md:col-span-3">
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
        </div>

        <EcencyConfigManager.Conditional
          condition={({ visionFeatures }) => visionFeatures.aiImageGenerator.enabled}
        >
          <div className="col-span-6 row-span-2 md:col-span-3">
            <LoginRequired>
              <Link href="/perks/ai-generator">
                <PerksBasicCard className="min-h-[13rem] cursor-pointer p-4">
                  <div className="md:text-lg font-bold">
                    {i18next.t("ai-image-generator.perk-card-title")}
                  </div>
                  <div className="text-sm md:text-base text-gray-600 dark:text-gray-400">
                    {i18next.t("ai-image-generator.perk-card-description")}
                  </div>
                </PerksBasicCard>
              </Link>
            </LoginRequired>
          </div>
        </EcencyConfigManager.Conditional>

        <div id="perks-spin" className="col-span-12 row-span-1">
          <LoginRequired>
            <PerksPointsSpinBanner />
          </LoginRequired>
        </div>
        {showBoost && <BoostDialog onHide={() => setShowBoost(false)} />}
        <PurchaseQrDialog show={showQrDialog} setShow={(v) => setShowQrDialog(v)} />
      </div>
    </div>
  );
}
