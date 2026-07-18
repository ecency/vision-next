"use client";

import { useActiveAccount } from "@/core/hooks/use-active-account";
import { useTransferMutation } from "@/api/sdk-mutations";
import { getLoginType } from "@/utils/user-token";
import { Button } from "@ui/button";
import { Alert } from "@ui/alert";
import i18next from "i18next";
import { useCallback, useEffect, useState } from "react";
import { hostingApi, type UpgradeQuote } from "./hosting-api";

/**
 * Prorated custom-domain upgrade for an existing ACTIVE standard tenant. Fetches the quote
 * (+1/mo x remaining months), then pays via a one-step `upgrade:<name>` HBD transfer — one-click
 * through the owner's Keychain when possible, or manual for other wallets. On success the tenant is
 * on the Pro plan and the caller re-fetches so the domain manager unlocks.
 */
export function CustomDomainUpgrade({
  tenant,
  onUpgraded
}: {
  tenant: string;
  onUpgraded: () => void;
}) {
  const { activeUser } = useActiveAccount();
  const [quote, setQuote] = useState<UpgradeQuote | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  // A transfer has been broadcast for this upgrade; keep the pay button locked so it can't be sent
  // twice with the same memo. Cleared only on a broadcast cancel/failure.
  const [paying, setPaying] = useState(false);
  const transfer = useTransferMutation();
  const canOneClick = !!activeUser && getLoginType(activeUser.username) === "keychain";

  useEffect(() => {
    let stale = false;
    hostingApi
      .upgradeQuote(tenant)
      .then((q) => {
        if (!stale) setQuote(q);
      })
      .catch(() => {
        if (!stale) setQuote({ eligible: false, reason: "error" });
      });
    return () => {
      stale = true;
    };
  }, [tenant]);

  // Poll the tenant until it reports the Pro plan (the upgrade was processed on chain).
  const pollUpgraded = useCallback(async () => {
    for (let i = 0; i < 15; i++) {
      try {
        const t = await hostingApi.tenant(tenant);
        if (t.subscriptionPlan === "pro") return true;
      } catch {
        // transient read error — keep polling
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    return false;
  }, [tenant]);

  const payWithHive = useCallback(async () => {
    if (!quote || !quote.eligible) return;
    setError("");
    setBusy(true);
    setPaying(true);
    try {
      await transfer.mutateAsync({ to: quote.to, amount: quote.amount, memo: quote.memo });
      if (await pollUpgraded()) onUpgraded();
      // Broadcast landed but not yet confirmed: keep `paying` true (button stays locked so the
      // same transfer isn't re-sent) and funnel to the manual re-check.
      else setError(i18next.t("hosting.upgrade-domain-pending"));
    } catch (e) {
      // Cancelled / broadcast failed — no payment sent, so allow another attempt.
      setPaying(false);
      setError((e as Error)?.message || i18next.t("hosting.pay-failed"));
    } finally {
      setBusy(false);
    }
  }, [quote, transfer, pollUpgraded, onUpgraded]);

  const checkUpgraded = useCallback(async () => {
    setError("");
    setBusy(true);
    try {
      const t = await hostingApi.tenant(tenant);
      if (t.subscriptionPlan === "pro") onUpgraded();
      else setError(i18next.t("hosting.not-yet-active"));
    } catch (e) {
      setError((e as Error)?.message || i18next.t("hosting.not-yet-active"));
    } finally {
      setBusy(false);
    }
  }, [tenant, onUpgraded]);

  if (!quote) {
    return <p className="text-sm opacity-75">{i18next.t("hosting.upgrade-domain-loading")}</p>;
  }
  if (!quote.eligible) {
    return (
      <p className="text-sm opacity-75">{i18next.t("hosting.upgrade-domain-unavailable")}</p>
    );
  }

  const manual = (
    <div className="rounded-lg border border-[--border-color] p-3 flex flex-col gap-1 font-mono text-sm">
      <div>
        {i18next.t("hosting.send-to")}: @{quote.to}
      </div>
      <div>
        {i18next.t("hosting.amount")}: {quote.amount}
      </div>
      <div>
        {i18next.t("hosting.memo")}: {quote.memo}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 text-sm">
      <p>
        {i18next.t("hosting.upgrade-domain-cost", {
          amount: quote.amount,
          months: quote.remainingMonths,
          perMonth: quote.perMonth
        })}
      </p>

      {canOneClick ? (
        <>
          <Button
            onClick={payWithHive}
            disabled={busy || paying}
            isLoading={busy}
            full={true}
          >
            {i18next.t("hosting.upgrade-domain-pay", { amount: quote.amount })}
          </Button>
          {busy && paying && (
            <p className="opacity-75">{i18next.t("hosting.pay-hbd-sending")}</p>
          )}
          <details open={paying} className="rounded-lg border border-[--border-color] p-3">
            <summary className="cursor-pointer select-none">
              {i18next.t("hosting.pay-hbd-manual")}
            </summary>
            <div className="flex flex-col gap-2 mt-3">
              {manual}
              <Button
                appearance="secondary"
                onClick={checkUpgraded}
                disabled={busy}
                isLoading={busy}
                full={true}
              >
                {i18next.t("hosting.ive-paid")}
              </Button>
            </div>
          </details>
        </>
      ) : (
        <>
          {manual}
          <Button onClick={checkUpgraded} disabled={busy} isLoading={busy} full={true}>
            {i18next.t("hosting.ive-paid")}
          </Button>
        </>
      )}

      {error && <Alert appearance="primary">{error}</Alert>}
    </div>
  );
}

export default CustomDomainUpgrade;
