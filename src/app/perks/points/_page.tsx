"use client";

import { LoginRequired, PurchaseQrDialog, PurchaseTypes } from "@/features/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PointsActionCard, PointsBasicInfo } from "./_components";
import i18next from "i18next";

export function PointsPage() {
  const [showPurchaseQr, setShowPurchaseQr] = useState(false);
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
      <PointsBasicInfo />

      <LoginRequired>
        <PointsActionCard
          imageSrc="/assets/undraw-credit-card.svg"
          title={i18next.t("perks.buy-points-qr-title")}
          description={i18next.t("perks.buy-points-qr-description")}
          buttonText={i18next.t("perks.buy-points-qr-button")}
          onClick={() => setShowPurchaseQr(true)}
        />
      </LoginRequired>
      <LoginRequired>
        <PointsActionCard
          imageSrc="/assets/undraw-transfer.svg"
          title={i18next.t("perks.buy-points-hive-title")}
          description={i18next.t("perks.buy-points-hive-description")}
          buttonText={i18next.t("perks.buy-points-hive-button")}
          onClick={() => router.push("/perks/points/buy-with-hive")}
        />
      </LoginRequired>

      <LoginRequired>
        <PointsActionCard
          imageSrc="/assets/undraw-savings.svg"
          title={i18next.t("perks.claim-points-title")}
          description={i18next.t("perks.claim-points-description")}
          buttonText={i18next.t("perks.claim-points-button")}
          onClick={() => {}}
        />
      </LoginRequired>

      <PurchaseQrDialog
        type={PurchaseTypes.POINTS}
        show={showPurchaseQr}
        setShow={setShowPurchaseQr}
      />
    </div>
  );
}
