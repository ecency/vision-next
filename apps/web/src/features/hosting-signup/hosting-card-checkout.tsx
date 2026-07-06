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
import { useCallback, useEffect, useRef, useState } from "react";

const isDarkMode = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

// Fresh per-checkout nonce (guarded for insecure-origin / older WebViews).
const genNonce = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface Props {
  /** The buyer / blog owner (authenticated). ePoints binds the order to this user. */
  username: string;
  /** The hosting SKU for the chosen term (e.g. "200hosting"). */
  sku: string;
  payLabel: string;
  returnUrl: string;
  onActivated: () => void;
  /** Fired once the card is confirmed (payment taken); the parent locks the term selector so
   *  a remount can't cancel the poll for an already-paid intent. */
  onConfirmed?: () => void;
}

/**
 * Card payment for hosting, riding the shared ePoints Stripe rail: create a PaymentIntent for
 * a hosting SKU via vapi, confirm with the Payment Element, then poll the order status. For a
 * hosting SKU the order reaching "success" means ePoints has already called the hosting
 * service's activate endpoint, so the blog is live. The tenant must already exist (the signup
 * flow creates it before this renders).
 */
export function HostingCardCheckout({
  username,
  sku,
  payLabel,
  returnUrl,
  onActivated,
  onConfirmed
}: Props) {
  const [nonce] = useState(genNonce);
  const [clientSecret, setClientSecret] = useState("");
  const [error, setError] = useState("");
  const [activating, setActivating] = useState(false);
  const pollingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const createIntent = useCreateStripeIntent(username);
  const stripePromise = getStripePromise();

  // Mint the PaymentIntent once for this checkout.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { client_secret } = await createIntent.mutateAsync({ sku, nonce });
        if (alive) setClientSecret(client_secret);
      } catch (e) {
        if (alive) setError((e as Error).message || i18next.t("hosting.card-unavailable"));
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sku, nonce]);

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
    setActivating(true);
    // Payment is confirmed at this point -- lock the term selector in the parent so a remount
    // cannot cancel this poll and strand a paid user.
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
          onActivated();
          return;
        }
        if (st.status === "failed") {
          pollingRef.current = false;
          setActivating(false);
          setError(i18next.t("hosting.card-failed"));
          return;
        }
      } catch {
        // transient (network / not-yet-recorded) -> keep polling
      }
      attempts += 1;
      if (attempts >= MAX_ATTEMPTS) {
        // Payment succeeded; ePoints keeps retrying activation with backoff, so this is not a
        // hard failure -- stop the spinner and reassure rather than loop forever.
        pollingRef.current = false;
        setActivating(false);
        setError(i18next.t("hosting.activation-pending"));
        return;
      }
      timerRef.current = setTimeout(poll, 2000);
    };
    poll();
  }, [paymentIntentId, username, onActivated, onConfirmed]);

  if (!stripePromise) {
    return <Alert appearance="danger">{i18next.t("hosting.card-unavailable")}</Alert>;
  }
  if (error) {
    return <Alert appearance="danger">{error}</Alert>;
  }
  if (activating) {
    return <div className="py-6 text-center text-sm opacity-75">{i18next.t("hosting.activating")}</div>;
  }
  if (!clientSecret) {
    return (
      <div className="py-6 text-center text-sm opacity-75">{i18next.t("hosting.preparing-checkout")}</div>
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
