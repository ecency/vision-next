import { useEffect } from "react";
import { t } from "@/core";
import { parseClaimTarget } from "./parse-claim-target";

/**
 * Shown on an UNCLAIMED *.blogs.ecency.com subdomain, which nginx serves the shared default
 * template config (carrying `template: true`) because no tenant row exists yet. Instead of a
 * working blog full of someone else's content, it invites the visitor to claim the subdomain.
 *
 * The instance type is derived from the hostname client-side: a `hive-<digits>` label reads as a
 * community, anything else as an author blog. noindex is emitted server-side via public/meta.html
 * (the SSI fallback for unclaimed hosts); the runtime meta below is a belt-and-suspenders for
 * JS-capable crawlers.
 */
const HOSTING_URL = "https://ecency.com/hosting";
const BASE_DOMAIN = "blogs.ecency.com";

export function ClaimLanding() {
  const host = typeof window !== "undefined" ? window.location.hostname : "";
  const { name, isCommunity } = parseClaimTarget(host);
  const title = isCommunity ? t("claim_title_community") : t("claim_title_blog");
  const claimHref = `${HOSTING_URL}?claim=${encodeURIComponent(name)}`;

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;
    // Keep unclaimed placeholders out of the index even for JS-running crawlers. The static
    // fallback meta.html sets the same header for everyone else.
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.title = prevTitle;
      meta.remove();
    };
  }, [title]);

  return (
    <div className="min-h-screen bg-theme-primary flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <div className="text-sm font-medium text-theme-muted mb-3">
          {name}.{BASE_DOMAIN}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 heading-theme">{title}</h1>
        <p className="text-theme-muted mb-8">{t("claim_subtitle")}</p>
        <a
          href={claimHref}
          className="inline-block px-6 py-3 rounded-lg bg-black text-white hover:bg-black/80 transition-colors font-medium"
        >
          {t("claim_cta")}
        </a>
      </div>
    </div>
  );
}

export default ClaimLanding;
