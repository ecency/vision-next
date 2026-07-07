"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getUsernameError } from "@/utils/username-validation";
import { Alert } from "@ui/alert";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  hostingApi,
  hostingSkuForMonths,
  hostingProSkuForMonths,
  HOSTING_CUSTOM_DOMAIN_MONTHLY_USD,
  type HostingPaymentMethods
} from "./hosting-api";
import { CustomDomainManager } from "./custom-domain-manager";
import dynamic from "next/dynamic";

// Lazy-load the card checkout so /hosting doesn't pull @stripe/stripe-js (which injects the
// js.stripe.com script on import) into its bundle until the user actually picks "card".
const HostingCardCheckout = dynamic(
  () => import("./hosting-card-checkout").then((m) => m.HostingCardCheckout),
  {
    ssr: false,
    loading: () => (
      <div className="py-6 text-center text-sm opacity-75">
        {i18next.t("hosting.preparing-checkout")}
      </div>
    )
  }
);

type Step = "username" | "configure" | "payment" | "success";
type Method = "hbd" | "card";

const TERMS = [1, 3, 6, 12];

interface Instructions {
  to: string;
  amount: string;
  memo: string;
}

export function HostingSignup() {
  const { activeUser } = useActiveAccount();

  const [step, setStep] = useState<Step>("username");
  const [username, setUsername] = useState(activeUser?.username ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [months, setMonths] = useState(1);
  // Custom domain add-on: switches to the $3/mo "prohosting" plan so the tenant activates on the
  // internal pro plan and can attach a custom domain after checkout.
  const [customDomain, setCustomDomain] = useState(false);
  const [method, setMethod] = useState<Method>("card");
  const [methods, setMethods] = useState<HostingPaymentMethods | null>(null);
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [blogUrl, setBlogUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // Card confirmed -> the term/method are locked so a remount can't cancel the activation poll.
  const [paying, setPaying] = useState(false);
  // The username we actually created a tenant for; if the user goes back and changes it,
  // we must create the new one before payment (a stale guard would let them pay for a blog
  // that was never created and never activates).
  const createdForRef = useRef("");

  const baseDomain = "blogs.ecency.com";
  const cardEnabled = !!methods?.card.enabled && !!activeUser && username === activeUser.username;

  useEffect(() => {
    hostingApi.paymentMethods().then(setMethods).catch(() => setMethods(null));
  }, []);

  // Default to HBD whenever card is not actually available to this visitor (logged out, or
  // the name is not their own), so the payment step never renders with no method shown.
  useEffect(() => {
    if (!cardEnabled) setMethod("hbd");
  }, [cardEnabled]);

  // Custom domain is a one-step card checkout (the on-chain HBD rail has no single "create + pro"
  // memo), so prefer card the moment the add-on is chosen and card is available.
  useEffect(() => {
    if (customDomain && cardEnabled) setMethod("card");
  }, [customDomain, cardEnabled]);

  const goConfigure = () => {
    setError("");
    const err = getUsernameError(username.trim().toLowerCase());
    if (err) {
      setError(err);
      return;
    }
    setStep("configure");
  };

  // Create the (inactive) tenant for the CURRENT username, then move to payment. Payment
  // activates it. Re-creates when the username changed since the last creation.
  const goPayment = useCallback(async () => {
    setError("");
    setBusy(true);
    const uname = username.trim().toLowerCase();
    try {
      if (createdForRef.current !== uname) {
        const res = await hostingApi.createTenant(uname, {
          theme: "system",
          title: title.trim() || undefined,
          description: description.trim() || undefined
        });
        createdForRef.current = uname;
        setBlogUrl(res.tenant.blogUrl);
      }
      setStep("payment");
    } catch (e) {
      const msg = (e as Error).message;
      // The tenant already existing is not an error for the owner: a member who claimed a free
      // blog can come back to add a custom domain / renew. Card is gated to the owner and the
      // checkout only needs the tenant to exist, so proceed straight to payment for own account.
      if (msg === "Username already registered" && activeUser?.username === uname) {
        createdForRef.current = uname;
        setBlogUrl(`https://${uname}.${baseDomain}`);
        setStep("payment");
      } else {
        setError(msg === "Username already registered" ? i18next.t("hosting.already-registered") : msg);
      }
    } finally {
      setBusy(false);
    }
  }, [username, title, description, activeUser]);

  // HBD: refresh instructions for the selected term. Guard against a slow earlier response
  // (a different term) landing after a newer one and showing a mismatched amount/memo. Skipped
  // for the custom domain add-on (that is a card-only one-step checkout).
  useEffect(() => {
    if (step !== "payment" || method !== "hbd" || customDomain) return;
    let stale = false;
    // Clear immediately so the previous term's amount/memo isn't copyable while the new one loads.
    setInstructions(null);
    hostingApi
      .paymentInstructions(username.trim().toLowerCase(), months)
      .then((r) => {
        if (!stale) setInstructions({ to: r.to, amount: r.amount, memo: r.memo });
      })
      .catch(() => {
        if (!stale) setInstructions(null);
      });
    return () => {
      stale = true;
    };
  }, [step, method, months, username, customDomain]);

  const checkActivation = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      const t = await hostingApi.tenant(username.trim().toLowerCase());
      if (t.subscriptionStatus === "active") {
        setStep("success");
      } else {
        setError(i18next.t("hosting.not-yet-active"));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [username]);

  const usdPerBase = (methods?.card.monthlyUsdCents ?? 200) / 100;
  const hbdPerBase = parseFloat(methods?.hbd.monthly ?? "2");
  // Custom domain is +$1/mo on top of hosting -> $3/mo total (and +1 HBD/mo for parity).
  const usdPer = customDomain ? HOSTING_CUSTOM_DOMAIN_MONTHLY_USD : usdPerBase;
  const hbdPer = customDomain ? hbdPerBase + 1 : hbdPerBase;
  const cardSku = customDomain ? hostingProSkuForMonths(months) : hostingSkuForMonths(months);

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{i18next.t("hosting.title")}</h1>
      <p className="opacity-75">{i18next.t("hosting.subtitle")}</p>
      <p className="text-sm">
        <Link href="/perks" className="text-blue-dark-sky hover:underline">
          {i18next.t("hosting.free-with-pro")}
        </Link>
      </p>

      {error && <Alert appearance="danger">{error}</Alert>}

      {step === "username" && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold">{i18next.t("hosting.username-label")}</label>
          <FormControl
            type="text"
            value={username}
            onChange={(e: any) => setUsername(e.target.value)}
            placeholder="yourname"
            autoFocus={true}
          />
          <p className="text-sm opacity-60">
            {i18next.t("hosting.subdomain-preview", { url: `${username || "yourname"}.${baseDomain}` })}
          </p>
          <Button onClick={goConfigure} full={true}>
            {i18next.t("g.continue")}
          </Button>
        </div>
      )}

      {step === "configure" && (
        <div className="flex flex-col gap-3">
          <label className="text-sm font-semibold">{i18next.t("hosting.blog-title-label")}</label>
          <FormControl
            type="text"
            value={title}
            onChange={(e: any) => setTitle(e.target.value)}
            placeholder={i18next.t("hosting.blog-title-placeholder")}
          />
          <label className="text-sm font-semibold">{i18next.t("hosting.blog-desc-label")}</label>
          <FormControl
            type="text"
            value={description}
            onChange={(e: any) => setDescription(e.target.value)}
            placeholder={i18next.t("hosting.blog-desc-placeholder")}
          />
          <div className="flex gap-2">
            <Button appearance="secondary" onClick={() => setStep("username")}>
              {i18next.t("g.back")}
            </Button>
            <Button onClick={goPayment} disabled={busy} isLoading={busy} full={true}>
              {i18next.t("g.continue")}
            </Button>
          </div>
        </div>
      )}

      {step === "payment" && (
        <div className="flex flex-col gap-4">
          {/* Term */}
          <div className="flex gap-2 flex-wrap">
            {TERMS.map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                disabled={paying}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  months === m ? "border-blue-dark-sky bg-blue-dark-sky/10" : "border-[--border-color]"
                } ${paying ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {i18next.t("hosting.term-months", { n: m })}
              </button>
            ))}
          </div>

          {/* Custom domain add-on */}
          <button
            onClick={() => setCustomDomain((v) => !v)}
            disabled={paying}
            className={`text-left px-4 py-3 rounded-lg border ${
              customDomain ? "border-blue-dark-sky bg-blue-dark-sky/10" : "border-[--border-color]"
            } ${paying ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{i18next.t("hosting.custom-domain-option")}</span>
              <span className="text-sm text-blue-dark-sky">
                {customDomain ? i18next.t("hosting.custom-domain-added") : i18next.t("hosting.custom-domain-price")}
              </span>
            </div>
            <p className="text-sm opacity-75 mt-1">{i18next.t("hosting.custom-domain-explainer")}</p>
          </button>

          {/* Method toggle */}
          <div className="flex gap-2">
            {cardEnabled && (
              <button
                onClick={() => setMethod("card")}
                disabled={paying}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                  method === "card" ? "border-blue-dark-sky bg-blue-dark-sky/10" : "border-[--border-color]"
                } ${paying ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                {i18next.t("hosting.pay-card", { amount: (usdPer * months).toFixed(2) })}
              </button>
            )}
            <button
              onClick={() => setMethod("hbd")}
              disabled={paying}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                method === "hbd" ? "border-blue-dark-sky bg-blue-dark-sky/10" : "border-[--border-color]"
              } ${paying ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {i18next.t("hosting.pay-hbd", { amount: (hbdPer * months).toFixed(3) })}
            </button>
          </div>

          {customDomain && (
            <p className="text-sm opacity-75">{i18next.t("hosting.custom-domain-included-note")}</p>
          )}

          {method === "card" && cardEnabled && (
            <HostingCardCheckout
              key={cardSku}
              username={username.trim().toLowerCase()}
              sku={cardSku}
              payLabel={i18next.t("hosting.pay-now")}
              returnUrl={typeof window !== "undefined" ? window.location.href : ""}
              onConfirmed={() => setPaying(true)}
              onActivated={() => setStep("success")}
            />
          )}

          {/* Custom domain over HBD would need two on-chain steps (subscribe, then upgrade), so
              steer to the one-step card checkout instead of taking a mis-priced HBD payment. */}
          {method === "hbd" && customDomain && (
            <Alert appearance="primary">
              <div className="flex flex-col gap-2">
                <span>{i18next.t("hosting.custom-domain-hbd-note")}</span>
                {cardEnabled && (
                  <Button appearance="link" onClick={() => setMethod("card")}>
                    {i18next.t("hosting.custom-domain-use-card")}
                  </Button>
                )}
              </div>
            </Alert>
          )}

          {method === "hbd" && !customDomain && (
            <div className="flex flex-col gap-2 text-sm">
              <p>{i18next.t("hosting.hbd-instructions")}</p>
              {instructions && (
                <div className="rounded-lg border border-[--border-color] p-3 flex flex-col gap-1 font-mono">
                  <div>{i18next.t("hosting.send-to")}: @{instructions.to}</div>
                  <div>{i18next.t("hosting.amount")}: {instructions.amount}</div>
                  <div>{i18next.t("hosting.memo")}: {instructions.memo}</div>
                </div>
              )}
              <Button onClick={checkActivation} disabled={busy} isLoading={busy} full={true}>
                {i18next.t("hosting.ive-paid")}
              </Button>
            </div>
          )}
        </div>
      )}

      {step === "success" && (
        <div className="flex flex-col gap-4">
          <Alert appearance="success">
            <div className="flex flex-col gap-2">
              <strong>{i18next.t("hosting.success-title")}</strong>
              {blogUrl && (
                <a
                  href={blogUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-dark-sky underline"
                >
                  {blogUrl}
                </a>
              )}
            </div>
          </Alert>

          {/* Custom domain plan -> let the owner attach and verify their domain now. */}
          {customDomain && activeUser && username === activeUser.username && (
            <CustomDomainManager username={activeUser.username} />
          )}
        </div>
      )}
    </div>
  );
}

export default HostingSignup;
