"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { error, success } from "@/features/shared/feedback";
import { LoginRequired } from "@/features/shared/login-required";
import { PurchaseQrDialog, PurchaseTypes } from "@/features/shared/purchase-qr";
import { StripePointsDialog, isStripeEnabled } from "@/features/shared/purchase-stripe";
import { getPointsQueryOptions, useClaimPoints } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PointsActionCard, PointsBasicInfo } from "./_components";
import { formatError } from "@/api/format-error";
import { getAccessToken } from "@/utils";

export function PointsPage() {
  const { activeUser } = useActiveAccount();
  const { data: activeUserPoints } = useQuery(getPointsQueryOptions(activeUser?.username));

  const [showPurchaseQr, setShowPurchaseQr] = useState(false);
  const [showStripe, setShowStripe] = useState(false);
  const [resumePi, setResumePi] = useState<string | undefined>(undefined);
  const router = useRouter();

  // Resume the card flow after a redirect-based payment method returns here (Stripe
  // appends payment_intent + redirect_status to the URL). Card payments resolve
  // in-place and never hit this; it covers wallet/redirect methods if enabled.
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const pi = params.get("payment_intent");
    if (pi && params.get("redirect_status") === "succeeded") {
      setResumePi(pi);
      setShowStripe(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const canClaim = useMemo(
    () => activeUserPoints?.uPoints && parseInt(activeUserPoints?.uPoints) !== 0,
    [activeUserPoints]
  );

  const { mutateAsync: claim, isPending } = useClaimPoints(
    activeUser?.username,
    getAccessToken(activeUser?.username ?? ""),
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
          steps={[
            i18next.t("perks.buy-points-qr-step-1"),
            i18next.t("perks.buy-points-qr-step-2"),
            i18next.t("perks.buy-points-qr-step-3")
          ]}
          buttonText={i18next.t("perks.buy-points-qr-button")}
          onClick={() => setShowPurchaseQr(true)}
        />
      </LoginRequired>
      {isStripeEnabled() && (
        <LoginRequired>
          <PointsActionCard
            imageSrc="/assets/undraw-credit-card.svg"
            title={i18next.t("perks.buy-points-card-title")}
            description={i18next.t("perks.buy-points-card-description")}
            buttonText={i18next.t("perks.buy-points-card-button")}
            onClick={() => setShowStripe(true)}
          />
        </LoginRequired>
      )}
      <LoginRequired>
        <PointsActionCard
          imageSrc="/assets/undraw-transfer.svg"
          title={i18next.t("perks.buy-points-hive-title")}
          description={i18next.t("perks.buy-points-hive-description")}
          steps={[
            i18next.t("perks.buy-points-hive-step-1"),
            i18next.t("perks.buy-points-hive-step-2"),
            i18next.t("perks.buy-points-hive-step-3")
          ]}
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
      {isStripeEnabled() && (
        <StripePointsDialog
          show={showStripe}
          setShow={(v) => {
            setShowStripe(v);
            if (!v) {
              setResumePi(undefined);
            }
          }}
          resumePaymentIntent={resumePi}
        />
      )}
    </div>
  );
}
