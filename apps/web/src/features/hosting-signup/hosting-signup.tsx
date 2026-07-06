"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Alert } from "@ui/alert";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import i18next from "i18next";
import { useCallback, useEffect, useRef, useState } from "react";
import { HostingCardCheckout } from "./hosting-card-checkout";
import { hostingApi, hostingSkuForMonths, type HostingPaymentMethods } from "./hosting-api";

type Step = "username" | "configure" | "payment" | "success";
type Method = "hbd" | "card";

const TERMS = [1, 3, 6, 12];
const USERNAME_RE = /^[a-z][a-z0-9.-]{2,15}$/;

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
  const [method, setMethod] = useState<Method>("card");
  const [methods, setMethods] = useState<HostingPaymentMethods | null>(null);
  const [instructions, setInstructions] = useState<Instructions | null>(null);
  const [blogUrl, setBlogUrl] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const tenantCreatedRef = useRef(false);

  const baseDomain = "blogs.ecency.com";
  const cardEnabled = !!methods?.card.enabled && !!activeUser && username === activeUser.username;

  useEffect(() => {
    hostingApi.paymentMethods().then(setMethods).catch(() => setMethods(null));
  }, []);

  // Default the payment method to whichever is available (card needs login).
  useEffect(() => {
    if (methods && !methods.card.enabled) setMethod("hbd");
  }, [methods]);

  const goConfigure = () => {
    setError("");
    if (!USERNAME_RE.test(username.trim().toLowerCase())) {
      setError(i18next.t("hosting.invalid-username"));
      return;
    }
    setStep("configure");
  };

  // Create the (inactive) tenant, then move to payment. Payment activates it.
  const goPayment = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      if (!tenantCreatedRef.current) {
        const res = await hostingApi.createTenant(username.trim().toLowerCase(), {
          theme: "system",
          title: title.trim() || undefined,
          description: description.trim() || undefined
        });
        tenantCreatedRef.current = true;
        setBlogUrl(res.tenant.blogUrl);
      }
      setStep("payment");
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg === "Username already registered" ? i18next.t("hosting.already-registered") : msg);
    } finally {
      setBusy(false);
    }
  }, [username, title, description]);

  // HBD: refresh instructions for the selected term whenever it changes on the HBD tab.
  useEffect(() => {
    if (step !== "payment" || method !== "hbd") return;
    hostingApi
      .paymentInstructions(username.trim().toLowerCase(), months)
      .then((r) => setInstructions({ to: r.to, amount: r.amount, memo: r.memo }))
      .catch(() => setInstructions(null));
  }, [step, method, months, username]);

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

  const usdPer = (methods?.card.monthlyUsdCents ?? 200) / 100;
  const hbdPer = parseFloat(methods?.hbd.monthly ?? "2");

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold">{i18next.t("hosting.title")}</h1>
      <p className="opacity-75">{i18next.t("hosting.subtitle")}</p>

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
                className={`px-3 py-2 rounded-lg border text-sm ${
                  months === m ? "border-blue-dark-sky bg-blue-dark-sky/10" : "border-[--border-color]"
                }`}
              >
                {i18next.t("hosting.term-months", { n: m })}
              </button>
            ))}
          </div>

          {/* Method toggle */}
          <div className="flex gap-2">
            {cardEnabled && (
              <button
                onClick={() => setMethod("card")}
                className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                  method === "card" ? "border-blue-dark-sky bg-blue-dark-sky/10" : "border-[--border-color]"
                }`}
              >
                {i18next.t("hosting.pay-card", { amount: (usdPer * months).toFixed(2) })}
              </button>
            )}
            <button
              onClick={() => setMethod("hbd")}
              className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
                method === "hbd" ? "border-blue-dark-sky bg-blue-dark-sky/10" : "border-[--border-color]"
              }`}
            >
              {i18next.t("hosting.pay-hbd", { amount: (hbdPer * months).toFixed(3) })}
            </button>
          </div>

          {method === "card" && cardEnabled && (
            <HostingCardCheckout
              username={username.trim().toLowerCase()}
              sku={hostingSkuForMonths(months)}
              payLabel={i18next.t("hosting.pay-now")}
              returnUrl={typeof window !== "undefined" ? window.location.href : ""}
              onActivated={() => setStep("success")}
            />
          )}

          {method === "hbd" && (
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
        <Alert appearance="success">
          <div className="flex flex-col gap-2">
            <strong>{i18next.t("hosting.success-title")}</strong>
            {blogUrl && (
              <a href={blogUrl} target="_blank" rel="noreferrer" className="text-blue-dark-sky underline">
                {blogUrl}
              </a>
            )}
          </div>
        </Alert>
      )}
    </div>
  );
}

export default HostingSignup;
