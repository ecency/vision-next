"use client";

import { getAccessToken } from "@/utils";
import { Alert } from "@ui/alert";
import { Button } from "@ui/button";
import { FormControl } from "@ui/input";
import { InputGroupCopyClipboard } from "@/features/ui/input/input-group-copy-clipboard";
import i18next from "i18next";
import { useCallback, useState } from "react";

interface Verification {
  type: string;
  name: string;
  value: string;
  instructions: string;
}

interface Props {
  /** The authenticated blog owner. Its HiveSigner token authorizes the domain calls. */
  username: string;
  /**
   * The tenant to attach the domain to when it differs from the owner account: a community
   * instance is keyed by its community id while the owner authorizes the call. Defaults to
   * the owner's personal blog.
   */
  tenant?: string;
}

/**
 * Custom-domain setup for a Custom domain plan tenant: enter your domain, receive the CNAME
 * record to add at your DNS provider, then verify. Talks only to the web's server proxies
 * (/api/hosting/domain[/verify]) which verify identity and hold the internal secret; the
 * browser never sees it.
 */
export function CustomDomainManager({ username, tenant }: Props) {
  const [domain, setDomain] = useState("");
  const [verification, setVerification] = useState<Verification | null>(null);
  const [verified, setVerified] = useState(false);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const authCode = () => getAccessToken(username) ?? "";

  const addDomain = useCallback(async () => {
    setError("");
    setPending(false);
    const d = domain.trim().toLowerCase();
    if (!d) {
      setError(i18next.t("custom-domain.enter-domain"));
      return;
    }
    const code = authCode();
    if (!code) {
      setError(i18next.t("custom-domain.login-required"));
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/hosting/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: d, code, ...(tenant ? { tenant } : {}) })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 402) setError(i18next.t("custom-domain.requires-plan"));
        else if (r.status === 409) setError(i18next.t("custom-domain.in-use"));
        else setError(data?.error || i18next.t("custom-domain.add-failed"));
        return;
      }
      setVerification(data.verification as Verification);
      setVerified(false);
    } catch {
      setError(i18next.t("custom-domain.add-failed"));
    } finally {
      setBusy(false);
    }
  }, [domain, username, tenant]);

  const verify = useCallback(async () => {
    setError("");
    setPending(false);
    const code = authCode();
    if (!code) {
      setError(i18next.t("custom-domain.login-required"));
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/hosting/domain/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...(tenant ? { tenant } : {}) })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data?.error || i18next.t("custom-domain.verify-failed"));
        return;
      }
      if (data?.verified) {
        setVerified(true);
      } else {
        setPending(true);
      }
    } catch {
      setError(i18next.t("custom-domain.verify-failed"));
    } finally {
      setBusy(false);
    }
  }, [username, tenant]);

  if (verified) {
    return (
      <Alert appearance="success">
        <div className="flex flex-col gap-1">
          <strong>{i18next.t("custom-domain.verified-title")}</strong>
          <span>{i18next.t("custom-domain.verified-body", { domain: domain.trim().toLowerCase() })}</span>
        </div>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-[--border-color] p-4">
      <div>
        <div className="font-semibold">{i18next.t("custom-domain.title")}</div>
        <p className="text-sm opacity-75">{i18next.t("custom-domain.subtitle")}</p>
      </div>

      {error && <Alert appearance="danger">{error}</Alert>}

      {!verification && (
        <>
          <FormControl
            type="text"
            value={domain}
            onChange={(e: any) => setDomain(e.target.value)}
            placeholder="blog.yoursite.com"
          />
          <Button onClick={addDomain} disabled={busy} isLoading={busy} full={true}>
            {i18next.t("custom-domain.add")}
          </Button>
        </>
      )}

      {verification && (
        <div className="flex flex-col gap-2 text-sm">
          <p>{i18next.t("custom-domain.cname-instructions")}</p>
          <Alert appearance="primary">{i18next.t("custom-domain.proxy-note")}</Alert>
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold opacity-75">
              {i18next.t("custom-domain.record-type")}: {verification.type}
            </label>
            <label className="text-xs font-semibold opacity-75">
              {i18next.t("custom-domain.record-name")}
            </label>
            <InputGroupCopyClipboard value={verification.name} />
            <label className="text-xs font-semibold opacity-75">
              {i18next.t("custom-domain.record-value")}
            </label>
            <InputGroupCopyClipboard value={verification.value} />
          </div>
          {pending && (
            <Alert appearance="warning">{i18next.t("custom-domain.pending")}</Alert>
          )}
          <Button onClick={verify} disabled={busy} isLoading={busy} full={true}>
            {i18next.t("custom-domain.verify")}
          </Button>
        </div>
      )}
    </div>
  );
}

export default CustomDomainManager;
