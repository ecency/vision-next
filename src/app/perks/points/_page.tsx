"use client";

import { PurchaseQrDialog, PurchaseTypes } from "@/features/shared";
import { PointsActionCard, PointsBasicInfo } from "./_components";
import { useState } from "react";

export function PointsPage() {
  const [showPurchaseQr, setShowPurchaseQr] = useState(false);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
      <PointsBasicInfo />

      <PointsActionCard
        imageSrc="/assets/undraw-credit-card.svg"
        title="Buy points with QR"
        description="Buy points using our mobile application by paying with in-app payment system using credit card"
        buttonText="Buy with QR code"
        onClick={() => setShowPurchaseQr(true)}
      />
      <PointsActionCard
        imageSrc="/assets/undraw-transfer.svg"
        title="Buy points using Hive/HBD"
        description="Already have some HIVE or HBD? Swap HIVE/HBD to POINTS quicky"
        buttonText="Buy with HIVE/HBD"
        onClick={() => {}}
      />

      <PointsActionCard
        imageSrc="/assets/undraw-savings.svg"
        title="Claim points"
        description="Claim FREE points every week"
        buttonText="Claim"
        onClick={() => {}}
      />

      <PurchaseQrDialog
        type={PurchaseTypes.POINTS}
        show={showPurchaseQr}
        setShow={setShowPurchaseQr}
      />
    </div>
  );
}
