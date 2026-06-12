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

const seen = new Set<string>();
// Caps total messages emitted per process — also bounds abuse, since report-uri
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
  // "enforce" means the resource was actually BLOCKED by a live policy; "report"
  // is report-only. Keep them in separate dedup slots so a report-only violation
  // never masks a later real (enforced) block of the same directive+host — and
  // raise an enforced block to error level since that one means something broke.
  const disposition = String(report["disposition"] || "report");
  const key = `${disposition}|${dir}|${host}`;
  if (!seen.has(key) && seen.size < MAX_UNIQUE) {
    seen.add(key);
    Sentry.captureMessage(`CSP ${disposition}: ${dir} blocked ${host}`, {
      level: disposition === "enforce" ? "error" : "warning",
      tags: { csp_directive: dir, csp_host: host, csp_disposition: disposition },
      extra: {
        blockedUri: blocked,
        documentUri: report["document-uri"],
        violatedDirective: report["violated-directive"]
      }
    });
  }

  return noContent();
}
