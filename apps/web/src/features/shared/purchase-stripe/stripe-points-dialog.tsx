"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Elements } from "@stripe/react-stripe-js";
import { Alert } from "@ui/alert";
import { Button } from "@ui/button";
import { Modal, ModalBody, ModalHeader, ModalTitle } from "@ui/modal";
import i18next from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { StripeCheckoutForm } from "./stripe-checkout-form";
import {
  DEFAULT_STRIPE_TIER_SKU,
  getStripePromise,
  STRIPE_POINTS_TIERS
} from "./stripe-config";
import { fetchStripeOrderStatus, useCreateStripeIntent } from "./use-stripe-points-purchase";

interface Props {
  show: boolean;
  setShow: (v: boolean) => void;
  defaultSku?: string;
  onDelivered?: (points: number) => void;
}

type Step = "select" | "pay" | "delivering" | "done" | "error";

const isDarkMode = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

/**
 * Reusable card-payment dialog for buying Points. Flow: pick a tier -> create a
 * PaymentIntent via vapi -> confirm with the Stripe Payment Element -> poll the order
 * status until the worker delivers. Credits the authenticated user (vapi forces it).
 * Card payment is hidden entirely when the publishable key is unconfigured.
 */
export function StripePointsDialog({ show, setShow, defaultSku, onDelivered }: Props) {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  const [step, setStep] = useState<Step>("select");
  const [sku, setSku] = useState(defaultSku ?? DEFAULT_STRIPE_TIER_SKU);
  const [nonce, setNonce] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [deliveredPoints, setDeliveredPoints] = useState<number | undefined>(undefined);
  const [errorMsg, setErrorMsg] = useState("");
  const pollingRef = useRef(false);

  const createIntent = useCreateStripeIntent(username);
  const stripePromise = getStripePromise();

  // Fresh per-checkout nonce on open; full reset on open/close.
  useEffect(() => {
    if (show) {
      setNonce(typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`);
      setStep("select");
      setSku(defaultSku ?? DEFAULT_STRIPE_TIER_SKU);
      setClientSecret("");
      setDeliveredPoints(undefined);
      setErrorMsg("");
      pollingRef.current = true;
    } else {
      pollingRef.current = false;
    }
  }, [show, defaultSku]);

  // The PaymentIntent id is the prefix of the client secret (pi_xxx_secret_yyy).
  const paymentIntentId = clientSecret ? clientSecret.split("_secret_")[0] : "";

  const startPayment = useCallback(async () => {
    setErrorMsg("");
    try {
      const { client_secret } = await createIntent.mutateAsync({ sku, nonce });
      setClientSecret(client_secret);
      setStep("pay");
    } catch {
      setErrorMsg(i18next.t("stripe-points.create-failed"));
      setStep("error");
    }
  }, [createIntent, sku, nonce]);

  // After the intent is confirmed, poll until the worker delivers the Points.
  useEffect(() => {
    if (step !== "delivering" || !username || !paymentIntentId) {
      return;
    }
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (!pollingRef.current) {
        return;
      }
      tries += 1;
      try {
        const st = await fetchStripeOrderStatus(username, paymentIntentId);
        if (!pollingRef.current) {
          return;
        }
        if (st.status === "success") {
          setDeliveredPoints(st.points);
          setStep("done");
          onDelivered?.(st.points ?? 0);
          return;
        }
        if (st.status === "failed") {
          setErrorMsg(i18next.t("stripe-points.delivery-failed"));
          setStep("error");
          return;
        }
      } catch {
        // transient (network / not-yet-recorded) -- keep polling
      }
      if (tries >= 20) {
        // Paid but not delivered after ~40s: reassure rather than error; it is in flight.
        setStep("done");
        return;
      }
      timer = setTimeout(poll, 2000);
    };
    poll();
    return () => clearTimeout(timer);
  }, [step, username, paymentIntentId, onDelivered]);

  const selectedTier = STRIPE_POINTS_TIERS.find((t) => t.sku === sku);

  return (
    <Modal show={show} centered={true} onHide={() => setShow(false)} size="md">
      <ModalHeader closeButton={true}>
        <ModalTitle>{i18next.t("stripe-points.title")}</ModalTitle>
      </ModalHeader>
      <ModalBody>
        {username && (
          <div className="text-sm opacity-75 mb-3">
            {i18next.t("stripe-points.credited-to", { username })}
          </div>
        )}

        {step === "select" && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2">
              {STRIPE_POINTS_TIERS.map((t) => (
                <button
                  key={t.sku}
                  type="button"
                  onClick={() => setSku(t.sku)}
                  className={`rounded-lg p-3 text-left transition-colors ${
                    t.sku === sku
                      ? "border-2 border-blue-dark-sky bg-blue-dark-sky bg-opacity-10"
                      : "border border-gray-200 dark:border-gray-700 hover:border-blue-dark-sky"
                  }`}
                >
                  <div className="font-bold">${t.usd.toFixed(2)}</div>
                  <div className="text-sm opacity-75">
                    {t.points.toLocaleString()} {i18next.t("stripe-points.points")}
                  </div>
                </button>
              ))}
            </div>
            <Button full={true} isLoading={createIntent.isPending} onClick={startPayment}>
              {i18next.t("stripe-points.continue")}
            </Button>
          </div>
        )}

        {step === "pay" && stripePromise && clientSecret && (
          <Elements
            stripe={stripePromise}
            options={{ clientSecret, appearance: { theme: isDarkMode() ? "night" : "stripe" } }}
          >
            <StripeCheckoutForm
              returnUrl={typeof window !== "undefined" ? window.location.href : ""}
              payLabel={
                selectedTier
                  ? i18next.t("stripe-points.pay", { usd: `$${selectedTier.usd.toFixed(2)}` })
                  : i18next.t("stripe-points.pay-generic")
              }
              onPaid={() => setStep("delivering")}
              onError={(m) => {
                setErrorMsg(m);
                setStep("error");
              }}
            />
          </Elements>
        )}

        {step === "delivering" && (
          <Alert appearance="primary">{i18next.t("stripe-points.delivering")}</Alert>
        )}

        {step === "done" && (
          <Alert appearance="success">
            {deliveredPoints
              ? i18next.t("stripe-points.done", { points: deliveredPoints.toLocaleString() })
              : i18next.t("stripe-points.done-pending")}
          </Alert>
        )}

        {step === "error" && (
          <div className="flex flex-col gap-3">
            <Alert appearance="danger">
              {errorMsg || i18next.t("stripe-points.create-failed")}
            </Alert>
            <Button appearance="secondary" onClick={() => setStep("select")}>
              {i18next.t("stripe-points.try-again")}
            </Button>
          </div>
        )}
      </ModalBody>
    </Modal>
  );
}
