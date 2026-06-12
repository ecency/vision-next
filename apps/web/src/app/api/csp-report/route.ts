import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// First-party CSP violation collector. The report-only policy in next.config.js
// points `report-uri` here instead of straight at Sentry. Piping a public
// site's report-only violations directly to Sentry floods it: every page with a
// third-party widget reports on every load, plus the infinite long tail of
// browser-extension-injected scripts. Here we (1) drop sources that aren't
// actionable for our own policy (extension schemes, eval/inline keywords) and
// (2) de-duplicate by (directive, host) so each genuinely-missing host is
// surfaced to Sentry EXACTLY ONCE per process — the signal needed to complete
// the allowlist before the policy is ever promoted to enforcing, without the
// flood. The dedup set resets on deploy, so a fresh release re-samples the
// current violation surface (which is what we want when the policy changes).

// Separate dedup sets per disposition so the (unbounded, UGC-driven) report-only
// long tail can't fill the budget and starve real enforced blocks out of Sentry.
const seenReport = new Set<string>();
const seenEnforce = new Set<string>();
// Caps unique entries per set per process — also bounds abuse, since report-uri
// is unauthenticated by design (browsers POST reports without credentials).
const MAX_UNIQUE = 2000;
const MAX_BODY_BYTES = 16 * 1024;

// Not actionable for our policy: browser extensions and in-page eval keywords.
const IGNORED_PREFIXES = [
  "chrome-extension",
  "moz-extension",
  "safari-extension",
  "safari-web-extension",
  "webkit-masked-url",
  "about:",
  "chrome:",
  "edge:"
];
const IGNORED_HOSTS = new Set(["inline", "eval", "wasm-eval", "self", ""]);

function hostOf(blocked: string): string {
  if (!blocked) return "";
  if (!blocked.includes("://")) return blocked; // keyword disposition (inline/eval/…)
  try {
    return new URL(blocked).host || blocked;
  } catch {
    return blocked;
  }
}

// CSP report fields arrive from an unauthenticated POST; strip CR/LF and bound
// length before interpolating into a log line, so a crafted report can't forge
// a second synthetic [csp-report] entry.
function clean(value: unknown): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").slice(0, 300);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const noContent = () => new NextResponse(null, { status: 204 });

  if (Number(req.headers.get("content-length") || 0) > MAX_BODY_BYTES) {
    return noContent();
  }

  let report: Record<string, unknown> | null = null;
  try {
    const text = await req.text();
    if (!text || text.length > MAX_BODY_BYTES) return noContent();
    const parsed = JSON.parse(text);
    // report-uri sends { "csp-report": {...} }; tolerate a bare object too.
    report = (parsed?.["csp-report"] ?? parsed) as Record<string, unknown> | null;
  } catch {
    return noContent();
  }
  if (!report || typeof report !== "object") return noContent();

  const directive = String(
    report["effective-directive"] || report["violated-directive"] || ""
  );
  const blocked = String(report["blocked-uri"] || "");
  const host = hostOf(blocked);

  if (IGNORED_HOSTS.has(host) || IGNORED_PREFIXES.some((p) => blocked.startsWith(p))) {
    return noContent();
  }

  const dir = directive.split(" ")[0];
  // Which policy posted this is taken from the per-policy report-uri marker we
  // set in next.config.js (?p=enforce / ?p=report) — authoritative and
  // independent of the CSP3 `disposition` field, which older browsers omit.
  // Fall back to that field, then to report-only, when the marker is absent.
  const policyMarker = req.nextUrl.searchParams.get("p");
  const isEnforce = policyMarker
    ? policyMarker === "enforce"
    : String(report["disposition"] || "") === "enforce";

  // Separate dedup sets so the report-only long tail can't starve enforce.
  const seen = isEnforce ? seenEnforce : seenReport;
  const key = `${dir}|${host}`;
  if (seen.has(key) || seen.size >= MAX_UNIQUE) return noContent();
  seen.add(key);

  if (isEnforce) {
    // A LIVE-enforced directive actually blocked a resource — rare, and it means
    // a real feature is broken — so surface it to Sentry as an error.
    Sentry.captureMessage(`CSP enforce: ${dir} blocked ${host}`, {
      level: "error",
      tags: { csp_directive: dir, csp_host: host, csp_disposition: "enforce" },
      extra: {
        blockedUri: blocked,
        documentUri: report["document-uri"],
        violatedDirective: report["violated-directive"]
      }
    });
  } else {
    // report-only: informational, and high-volume on a UGC site (every host a
    // post embeds generates one). It must NOT enter Sentry's issue stream — log
    // it (sanitized) so the blocked hosts can be reviewed from the app logs
    // (e.g. `grep '\[csp-report\]'`) when curating the allowlist before any
    // directive is promoted to enforcing.
    console.info(
      `[csp-report] ${clean(dir)} blocked ${clean(host)} doc=${clean(report["document-uri"]) || "?"}`
    );
  }

  return noContent();
}
