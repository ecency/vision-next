"use client";

import { Elements } from "@stripe/react-stripe-js";
import { Alert } from "@ui/alert";
import { Button } from "@ui/button";
import i18next from "i18next";
import { useEffect, useRef, useState } from "react";
import { StripeCheckoutForm } from "./stripe-checkout-form";
import { getStripePromise } from "./stripe-config";
import {
  AccountPurchaseMeta,
  fetchStripeAccountStatus,
  STRIPE_ACCOUNT_USD,
  useCreateAccountIntent
} from "./use-stripe-account-purchase";

interface Props {
  /** Already client-validated; the server re-validates before charging. */
  meta: AccountPurchaseMeta;
  /** Single-use Cloudflare Turnstile token, collected on the form before this mounts. */
  captchaToken: string;
  /** Back to the form. The caller MUST reset the Turnstile (the token is consumed here). */
  onBack: () => void;
}

type Step = "creating" | "pay" | "delivering" | "done" | "error";

const isDarkMode = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

const genNonce = (): string =>
  typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function createIntentError(e: any): string {
  const status = e?.response?.status;
  // 406 = captcha rejected; 409 = name taken/reserved; 503 = could not verify availability.
  if (status === 406) return i18next.t("sign-up.captcha-failed");
  if (status === 409) return i18next.t("sign-up.username-exists");
  if (status === 503) return i18next.t("sign-up.account-verify-retry");
  return i18next.t("sign-up.account-pay-failed");
}

/**
 * Buy a premium account with a card. Creates the PaymentIntent ONCE on mount (the captcha
 * token is single-use and already collected), confirms with the Stripe Payment Element, then
 * polls the anonymous order status until the worker records the account request. Account keys
 * are created + emailed by the onboard service, so "done" means requested, not delivered.
 */
export function StripeAccountCheckout({ meta, captchaToken, onBack }: Props) {
  const [step, setStep] = useState<Step>("creating");
  const [nonce] = useState(genNonce);
  const [clientSecret, setClientSecret] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const startedRef = useRef(false);
  const mountedRef = useRef(true);

  const createIntent = useCreateAccountIntent();
  const stripePromise = getStripePromise();

  // Track real mount state for the async state-setters below. Set in its OWN mount effect so
  // React StrictMode's dev setup->cleanup->setup leaves it TRUE (the final setup wins). A
  // per-mount closure flag would be torn down to a stale `false` and swallow the result.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Mint the PaymentIntent exactly once. startedRef prevents re-spending the single-use
  // captcha token under a StrictMode double-mount / re-render; mountedRef (NOT a per-mount
  // closure) gates the state-setters so the resolved result is never swallowed.
  useEffect(() => {
    if (startedRef.current) {
      return;
    }
    startedRef.current = true;
    (async () => {
      try {
        const { client_secret } = await createIntent.mutateAsync({ meta, nonce, captchaToken });
        if (!mountedRef.current) {
          return;
        }
        setClientSecret(client_secret);
        setStep("pay");
      } catch (e) {
        if (!mountedRef.current) {
          return;
        }
        setErrorMsg(createIntentError(e));
        setStep("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paymentIntentId = clientSecret ? clientSecret.split("_secret_")[0] : "";

  // After the card is confirmed, poll until the account request is recorded.
  useEffect(() => {
    if (step !== "delivering" || !paymentIntentId) {
      return;
    }
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      if (!mountedRef.current) {
        return;
      }
      tries += 1;
      try {
        const st = await fetchStripeAccountStatus(meta.username, paymentIntentId);
        if (!pollingRef.current) {
          return;
        }
        if (st.status === "success") {
          setStep("done");
          return;
        }
        if (st.status === "failed") {
          setErrorMsg(i18next.t("sign-up.account-delivery-failed"));
          setStep("error");
          return;
        }
      } catch {
        // transient (network / not-yet-recorded) -- keep polling
      }
      if (tries >= 20) {
        // Paid but not recorded after ~40s: reassure -- it is in flight + the email follows.
        setStep("done");
        return;
      }
      timer = setTimeout(poll, 2000);
    };
    poll();
    return () => clearTimeout(timer);
  }, [step, paymentIntentId, meta.username]);

  return (
    <div className="flex flex-col gap-4">
      {step === "creating" && (
        <Alert appearance="primary">{i18next.t("sign-up.account-starting")}</Alert>
      )}

      {step === "pay" && stripePromise && clientSecret && (
        <Elements
          stripe={stripePromise}
          options={{ clientSecret, appearance: { theme: isDarkMode() ? "night" : "stripe" } }}
        >
          <StripeCheckoutForm
            returnUrl={typeof window !== "undefined" ? window.location.href : ""}
            payLabel={i18next.t("sign-up.account-pay", { usd: `$${STRIPE_ACCOUNT_USD.toFixed(2)}` })}
            onPaid={() => setStep("delivering")}
            onError={(m) => {
              setErrorMsg(m);
              setStep("error");
            }}
          />
        </Elements>
      )}

      {step === "delivering" && (
        <Alert appearance="primary">{i18next.t("sign-up.account-processing")}</Alert>
      )}

      {step === "done" && (
        <Alert appearance="success">{i18next.t("sign-up.account-requested")}</Alert>
      )}

      {step === "error" && (
        <div className="flex flex-col gap-3">
          <Alert appearance="danger">{errorMsg || i18next.t("sign-up.account-pay-failed")}</Alert>
          <Button appearance="secondary" onClick={onBack}>
            {i18next.t("g.back")}
          </Button>
        </div>
      )}
    </div>
  );
}
