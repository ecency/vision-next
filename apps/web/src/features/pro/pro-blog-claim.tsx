"use client";

import { getAccessToken } from "@/utils";
import { Alert } from "@ui/alert";
import { Button } from "@ui/button";
import i18next from "i18next";
import Link from "next/link";
import { useCallback, useState } from "react";

const BASE_DOMAIN = "blogs.ecency.com";

interface Props {
  /** The authenticated Ecency Pro member. Its HiveSigner token authorizes the claim. */
  username: string;
}

/**
 * "Claim your free blog" surface for Ecency Pro members. Ecency Pro bundles a free blog at
 * {username}.blogs.ecency.com; this action idempotently activates it via the web proxy
 * (/api/hosting/claim-blog), then links to the blog and the Custom domain upgrade. The proxy
 * re-checks Pro membership server-side, so this is safe even if rendered for a non-member.
 */
export function ProBlogClaim({ username }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [blogUrl, setBlogUrl] = useState("");

  const subdomain = `${username}.${BASE_DOMAIN}`;

  const claim = useCallback(async () => {
    setError("");
    const code = getAccessToken(username) ?? "";
    if (!code) {
      setError(i18next.t("pro-blog.login-required"));
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/hosting/claim-blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code })
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 403) setError(i18next.t("pro-blog.not-pro"));
        else if (r.status === 503) setError(i18next.t("pro-blog.unavailable"));
        else setError(data?.error || i18next.t("pro-blog.claim-failed"));
        return;
      }
      setBlogUrl(data?.tenant?.blogUrl || `https://${subdomain}`);
    } catch {
      setError(i18next.t("pro-blog.claim-failed"));
    } finally {
      setBusy(false);
    }
  }, [username, subdomain]);

  if (blogUrl) {
    return (
      <Alert appearance="success">
        <div className="flex flex-col gap-2">
          <strong>{i18next.t("pro-blog.claimed-title")}</strong>
          <a href={blogUrl} target="_blank" rel="noreferrer" className="text-blue-dark-sky underline">
            {blogUrl}
          </a>
          <p className="text-sm opacity-75">{i18next.t("pro-blog.custom-domain-upsell")}</p>
          <Link href="/hosting" className="text-blue-dark-sky hover:underline text-sm font-semibold">
            {i18next.t("pro-blog.add-custom-domain")}
          </Link>
        </div>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-[--border-color] p-4">
      <div className="font-semibold">{i18next.t("pro-blog.title")}</div>
      <p className="text-sm opacity-75">
        {i18next.t("pro-blog.includes", { subdomain })}
      </p>
      {error && <Alert appearance="danger">{error}</Alert>}
      <Button onClick={claim} disabled={busy} isLoading={busy} full={true}>
        {i18next.t("pro-blog.claim")}
      </Button>
    </div>
  );
}

export default ProBlogClaim;
