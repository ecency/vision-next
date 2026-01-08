"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { error, LoginRequired, PurchaseQrDialog, PurchaseTypes, success } from "@/features/shared";
import { getPointsQueryOptions, useClaimPoints } from "@ecency/wallets";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PointsActionCard, PointsBasicInfo } from "./_components";
import { formatError } from "@/api/operations";

export function PointsPage() {
  const { activeUser } = useActiveAccount();
  const { data: activeUserPoints } = useQuery(getPointsQueryOptions(activeUser?.username));

  const [showPurchaseQr, setShowPurchaseQr] = useState(false);
  const router = useRouter();

  const canClaim = useMemo(
    () => activeUserPoints?.uPoints && parseInt(activeUserPoints?.uPoints) !== 0,
    [activeUserPoints]
  );

  const { mutateAsync: claim, isPending } = useClaimPoints(
    activeUser?.username,
    activeUser?.accessToken,
    () => success(i18next.t("points.claim-ok")),
    (err) => error(...formatError(err))
  );

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
          buttonDisabled={!canClaim}
          buttonLoading={isPending}
          buttonText={
            <>
              {!canClaim && i18next.t("perks.claim-points-nothing")}
              {canClaim && i18next.t("perks.claim-points-button")}
              {canClaim && (
                <span className="font-bold ml-1">
                  {`(+${parseInt(activeUserPoints?.uPoints).toFixed(0)})`}
                </span>
              )}
            </>
          }
          onClick={() => claim({})}
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
