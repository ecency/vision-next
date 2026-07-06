"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";

import { error, success } from "@/features/shared/feedback";
import { LoginRequired } from "@/features/shared/login-required";
import { PurchaseQrDialog, PurchaseTypes } from "@/features/shared/purchase-qr";
import {
  StripePointsDialog,
  isKnownTierSku,
  isStripeEnabled
} from "@/features/shared/purchase-stripe";
import { QueryKeys, getPointsQueryOptions, useClaimPoints } from "@ecency/sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import i18next from "i18next";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PointsActionCard, PointsBasicInfo } from "./_components";
import { formatError } from "@/api/format-error";
import { getAccessToken } from "@/utils";

export function PointsPage() {
  const { activeUser } = useActiveAccount();
  const { data: activeUserPoints } = useQuery(getPointsQueryOptions(activeUser?.username));

  const [showPurchaseQr, setShowPurchaseQr] = useState(false);
  const [showStripe, setShowStripe] = useState(false);
  const [resumePi, setResumePi] = useState<string | undefined>(undefined);
  // Non-null once a ?buy=card deep link is seen; carries the preselected tier and
  // keeps it available to the dialog until the dialog is closed.
  const [deepLinkBuy, setDeepLinkBuy] = useState<{ sku?: string } | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Remove only our own params, preserving any unrelated query (utm/ref), the hash,
  // and the App Router's history state.
  const clearSearchParams = useCallback((keys: string[]) => {
    const url = new URL(window.location.href);
    let changed = false;
    for (const key of keys) {
      if (url.searchParams.has(key)) {
        url.searchParams.delete(key);
        changed = true;
      }
    }
    if (changed) {
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
    }
  }, []);

  // Upsell deep-link (?buy=card&sku=...): arm the card dialog with the tier that
  // covers the caller's deficit preselected. The params stay in the URL until the
  // dialog actually opens (below), so a redirect-based login round-trip doesn't
  // lose the intent. An unknown/absent sku falls back to the dialog default.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("buy") !== "card" || !isStripeEnabled()) {
      return;
    }
    const sku = params.get("sku") ?? undefined;
    setDeepLinkBuy({ sku: sku && isKnownTierSku(sku) ? sku : undefined });
  }, []);

  // The dialog needs an authenticated user to create the intent, so open once the
  // active user is available (covers login completing after landing on the link).
  // Strip the params only now that the intent has been consumed.
  useEffect(() => {
    if (deepLinkBuy && activeUser && !showStripe) {
      setShowStripe(true);
      clearSearchParams(["buy", "sku"]);
    }
  }, [deepLinkBuy, activeUser, showStripe, clearSearchParams]);

  // Resume the card flow after a redirect-based payment method returns here (Stripe
  // appends payment_intent + redirect_status to the URL). Card payments resolve
  // in-place and never hit this; it covers wallet/redirect methods if enabled.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pi = params.get("payment_intent");
    if (!pi) {
      return;
    }
    const status = params.get("redirect_status");
    // Clear Stripe's params from the address bar regardless of outcome.
    clearSearchParams(["payment_intent", "redirect_status"]);
    if (status === "succeeded" || status === "processing") {
      // still in flight -> resume into the delivery poll
      setResumePi(pi);
      setShowStripe(true);
    } else {
      // failed / requires_payment_method / canceled -> tell the user
      error(i18next.t("stripe-points.pay-failed"));
    }
  }, [clearSearchParams]);

  const onPointsDelivered = useCallback(() => {
    const username = activeUser?.username;
    if (username) {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points._prefix(username) });
    }
  }, [queryClient, activeUser?.username]);

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
          imageSrc="/assets/undraw-qr-points.svg"
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
              setDeepLinkBuy(null);
            }
          }}
          defaultSku={deepLinkBuy?.sku}
          resumePaymentIntent={resumePi}
          onDelivered={onPointsDelivered}
        />
      )}
    </div>
  );
}
