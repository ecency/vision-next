"use client";

import { getStripePromise } from "@/features/shared/purchase-stripe";
import { StripeCheckoutForm } from "@/features/shared/purchase-stripe/stripe-checkout-form";
import {
  fetchStripeOrderStatus,
  useCreateStripeIntent
} from "@/features/shared/purchase-stripe/use-stripe-points-purchase";
import { Elements } from "@stripe/react-stripe-js";
import { Alert } from "@ui/alert";
import i18next from "i18next";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const isDarkMode = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

// Fresh per-checkout nonce (guarded for insecure-origin / older WebViews).
const genNonce = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface Props {
  /** The buyer / payer (authenticated). ePoints binds the Stripe order to this user; the
   *  recipient below is credited the Points, but the charge is on the payer. */
  username: string;
  /** The Points SKU for the chosen pack (e.g. "999points"). */
  sku: string;
  /** The Hive account credited the purchased Points (not the payer). */
  recipient: string;
  /** Optional short note carried with the gift. */
  message?: string;
  payLabel: string;
  returnUrl: string;
  /** Fired only on a real `success` order status (Points confirmed credited to the recipient). */
  onDelivered: () => void;
  /** Fired when the payment succeeded but delivery has not confirmed within the poll window --
   *  the gift is in flight, NOT confirmed. The parent must show a pending (not success) message. */
  onPending?: () => void;
  /** Fired once the card is confirmed (payment taken) so the parent can lock the form. */
  onConfirmed?: () => void;
}

/**
 * Card payment for gifting Points, riding the shared ePoints Stripe rail: create a
 * PaymentIntent for a Points SKU via vapi -- passing `gift_recipient` + `gift_message` so
 * ePoints credits the recipient instead of the payer -- confirm with the Payment Element,
 * then poll the order status until the worker delivers. The parent MUST include `sku` and
 * `recipient` in this component's `key` so a change remounts with a fresh nonce (the intent
 * is minted once per mount).
 */
export function GiftCardCheckout({
  username,
  sku,
  recipient,
  message,
  payLabel,
  returnUrl,
  onDelivered,
  onPending,
  onConfirmed
}: Props) {
  // The nonce is the create-intent idempotency key, so it must change when the checkout
  // identity (sku, recipient or message) changes; otherwise a re-mint would return the
  // PaymentIntent already created for the previous gift. Fresh nonce per (sku, recipient, message).
  const nonce = useMemo(genNonce, [sku, recipient, message]);
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [delivering, setDelivering] = useState(false);
  const pollingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const createIntent = useCreateStripeIntent(username);
  const stripePromise = getStripePromise();

  // Mint the PaymentIntent for this checkout. Re-mint when the sku/recipient/message changes so
  // the active clientSecret always matches what the UI shows.
  useEffect(() => {
    let alive = true;
    setClientSecret("");
    (async () => {
      try {
        const { client_secret } = await createIntent.mutateAsync({
          sku,
          nonce,
          gift_recipient: recipient,
          gift_message: message?.trim() || undefined
        });
        if (alive) setClientSecret(client_secret);
      } catch (e) {
        if (alive) setError((e as Error).message || i18next.t("points-gift.card-unavailable"));
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku, nonce, recipient, message]);

  // Stop polling on unmount.
  useEffect(
    () => () => {
      pollingRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const paymentIntentId = clientSecret ? clientSecret.split("_secret_")[0] : "";

  const startPoll = useCallback(() => {
    if (!paymentIntentId || pollingRef.current) return;
    pollingRef.current = true;
    setDelivering(true);
    // Payment is confirmed -- tell the parent to lock the form so a remount can't cancel
    // this poll and strand a paid user.
    onConfirmed?.();
    let attempts = 0;
    const MAX_ATTEMPTS = 45; // ~90s
    const poll = async () => {
      if (!pollingRef.current) return;
      try {
        const st = await fetchStripeOrderStatus(username, paymentIntentId);
        if (!pollingRef.current) return;
        if (st.status === "success") {
          pollingRef.current = false;
          onDelivered();
          return;
        }
        if (st.status === "failed") {
          pollingRef.current = false;
          setDelivering(false);
          setError(i18next.t("points-gift.delivery-failed"));
          return;
        }
      } catch {
        // transient (network / not-yet-recorded) -> keep polling
      }
      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) {
        // Payment succeeded but delivery never confirmed within the window. ePoints keeps
        // retrying, so this is not a hard failure -- but we have NOT seen `success`, so report
        // it as pending (in flight) rather than telling the buyer the gift was delivered.
        pollingRef.current = false;
        onPending?.();
        return;
      }
      timerRef.current = setTimeout(poll, 2000);
    };
    poll();
  }, [paymentIntentId, username, onDelivered, onPending, onConfirmed]);

  if (!stripePromise) {
    return <Alert appearance="danger">{i18next.t("points-gift.card-unavailable")}</Alert>;
  }
  if (error) {
    return <Alert appearance="danger">{error}</Alert>;
  }
  if (delivering) {
    return (
      <div className="py-6 text-center text-sm opacity-75">
        {i18next.t("points-gift.delivering")}
      </div>
    );
  }
  if (!clientSecret) {
    return (
      <div className="py-6 text-center text-sm opacity-75">
        {i18next.t("points-gift.preparing-checkout")}
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret, appearance: { theme: isDarkMode() ? "night" : "stripe" } }}
    >
      <StripeCheckoutForm
        returnUrl={returnUrl}
        payLabel={payLabel}
        onPaid={startPoll}
        onError={setError}
      />
    </Elements>
  );
}
