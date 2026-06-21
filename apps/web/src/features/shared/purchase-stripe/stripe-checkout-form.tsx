"use client";

import { Button } from "@ui/button";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import i18next from "i18next";
import { useState } from "react";

interface Props {
  /** Where redirect-based methods return to; card resolves in-page (redirect: if_required). */
  returnUrl: string;
  payLabel: string;
  onPaid: () => void;
  onError: (message: string) => void;
}

/**
 * The Payment Element + confirm button. Rendered ONLY inside <Elements> (it uses the
 * Stripe context). Card payments resolve in-place; a redirect-only method would bounce
 * to returnUrl.
 */
export function StripeCheckoutForm({ returnUrl, payLabel, onPaid, onError }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || submitting) {
      return;
    }
    setSubmitting(true);
    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: returnUrl }
    });
    setSubmitting(false);

    if (error) {
      // card declined / validation / network -- surface Stripe's localized message
      onError(error.message ?? i18next.t("stripe-points.pay-failed"));
      return;
    }
    if (paymentIntent && ["succeeded", "processing"].includes(paymentIntent.status)) {
      onPaid();
      return;
    }
    // requires_action handled by Stripe.js; anything else here is unexpected
    onError(i18next.t("stripe-points.pay-failed"));
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <PaymentElement onReady={() => setReady(true)} />
      <Button
        type="submit"
        full={true}
        disabled={!stripe || !elements || !ready || submitting}
        isLoading={submitting}
      >
        {payLabel}
      </Button>
    </form>
  );
}
