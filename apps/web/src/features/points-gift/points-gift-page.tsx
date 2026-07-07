"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { LoginRequired } from "@/features/shared/login-required";
import {
  DEFAULT_STRIPE_TIER_SKU,
  STRIPE_POINTS_TIERS,
  isStripeEnabled
} from "@/features/shared/purchase-stripe/stripe-tiers";
import { Alert } from "@ui/alert";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { UilGift } from "@tooni/iconscout-unicons-react";
import i18next from "i18next";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { GiftCardPreview } from "./gift-card-preview";
import { isValidGiftRecipient } from "./is-valid-gift-recipient";

// Lazy-load the card checkout so /gift doesn't pull @stripe/stripe-js (which injects the
// js.stripe.com script on import) into its bundle until the user actually pays.
const GiftCardCheckout = dynamic(
  () => import("./gift-card-checkout").then((m) => m.GiftCardCheckout),
  {
    ssr: false,
    loading: () => (
      <div className="py-6 text-center text-sm opacity-75">
        {i18next.t("points-gift.preparing-checkout")}
      </div>
    )
  }
);

const MESSAGE_MAX = 100;

type Step = "form" | "pay" | "done";

export function PointsGiftPage() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;

  const [step, setStep] = useState<Step>("form");
  const [recipient, setRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [sku, setSku] = useState(DEFAULT_STRIPE_TIER_SKU);
  // Locked once the card is confirmed so a remount can't cancel the delivery poll.
  const [locked, setLocked] = useState(false);

  // Prefill the recipient from ?to= (e.g. gifting from a post). Read from the URL directly
  // so we avoid the useSearchParams Suspense boundary; runs once on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const to = new URLSearchParams(window.location.search).get("to");
    if (to) {
      setRecipient(to.replace(/^@/, ""));
    }
  }, []);

  const cleanRecipient = useMemo(() => recipient.trim().replace(/^@/, "").toLowerCase(), [recipient]);
  const recipientValid = useMemo(() => isValidGiftRecipient(cleanRecipient), [cleanRecipient]);
  const selectedTier = useMemo(
    () => STRIPE_POINTS_TIERS.find((t) => t.sku === sku) ?? STRIPE_POINTS_TIERS[0],
    [sku]
  );

  if (!isStripeEnabled()) {
    return (
      <div className="max-w-lg mx-auto py-12 text-center opacity-75">
        {i18next.t("points-gift.card-unavailable")}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col gap-6 py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <UilGift className="w-7 h-7 text-blue-dark-sky" />
          {i18next.t("points-gift.title")}
        </h1>
        <p className="opacity-75">{i18next.t("points-gift.subtitle")}</p>
      </div>

      <GiftCardPreview
        points={selectedTier.points}
        recipient={cleanRecipient}
        message={message}
      />

      {step === "done" ? (
        <div className="flex flex-col gap-4">
          <Alert appearance="success">
            {i18next.t("points-gift.done", {
              points: selectedTier.points.toLocaleString(),
              recipient: `@${cleanRecipient}`
            })}
          </Alert>
          <div className="flex gap-2">
            <Button
              appearance="secondary"
              onClick={() => {
                setStep("form");
                setLocked(false);
                setRecipient("");
                setMessage("");
                setSku(DEFAULT_STRIPE_TIER_SKU);
              }}
            >
              {i18next.t("points-gift.send-another")}
            </Button>
            <Button appearance="link" href={`/@${cleanRecipient}`}>
              {i18next.t("points-gift.view-recipient")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">
              {i18next.t("points-gift.recipient-label")}
            </label>
            <FormControl
              type="text"
              value={recipient}
              disabled={locked}
              onChange={(e: any) => setRecipient(e.target.value)}
              placeholder={i18next.t("points-gift.recipient-placeholder")}
            />
            {recipient.trim() !== "" && !recipientValid && (
              <p className="text-sm text-red">{i18next.t("points-gift.recipient-invalid")}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">
              {i18next.t("points-gift.amount-label")}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STRIPE_POINTS_TIERS.map((t) => (
                <button
                  key={t.sku}
                  type="button"
                  disabled={locked}
                  onClick={() => setSku(t.sku)}
                  className={`rounded-lg p-3 text-left transition-colors disabled:opacity-60 ${
                    t.sku === sku
                      ? "border-2 border-blue-dark-sky bg-blue-dark-sky bg-opacity-10"
                      : "border border-gray-200 dark:border-gray-700 hover:border-blue-dark-sky"
                  }`}
                >
                  <div className="font-bold">
                    {t.points.toLocaleString()} {i18next.t("points-gift.points-unit")}
                  </div>
                  <div className="text-sm opacity-75">${t.usd.toFixed(2)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">
              {i18next.t("points-gift.message-label")}
            </label>
            <FormControl
              type="textarea"
              rows={2}
              value={message}
              disabled={locked}
              maxLength={MESSAGE_MAX}
              onChange={(e: any) => setMessage(e.target.value.slice(0, MESSAGE_MAX))}
              placeholder={i18next.t("points-gift.message-placeholder")}
            />
            <div className="text-xs opacity-50 text-right">
              {message.length}/{MESSAGE_MAX}
            </div>
          </div>

          {step === "form" && (
            <LoginRequired>
              <Button
                full={true}
                disabled={!recipientValid}
                onClick={() => setStep("pay")}
              >
                {i18next.t("points-gift.pay", { usd: `$${selectedTier.usd.toFixed(2)}` })}
              </Button>
            </LoginRequired>
          )}

          {step === "pay" && username && (
            <GiftCardCheckout
              key={`${sku}:${cleanRecipient}`}
              username={username}
              sku={sku}
              recipient={cleanRecipient}
              message={message}
              payLabel={i18next.t("points-gift.pay", { usd: `$${selectedTier.usd.toFixed(2)}` })}
              returnUrl={typeof window !== "undefined" ? window.location.href : ""}
              onConfirmed={() => setLocked(true)}
              onDelivered={() => setStep("done")}
            />
          )}
        </div>
      )}
    </div>
  );
}
