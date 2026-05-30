// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import appPackage from "./package.json";

// Defer Sentry initialization until after first user interaction or 5s idle.
// This moves ~1s of JS evaluation off the critical rendering path.
const SENTRY_CONFIG: Sentry.BrowserOptions = {
  dsn: "https://8a5c1659d1c2ba3385be28dc7235ce56@o4507985141956608.ingest.de.sentry.io/4507985146609744",

  enabled: process.env.NODE_ENV === "production",
  // Prefer SENTRY_RELEASE (set per-deploy to the commit SHA in CI) so
  // source-map upload and runtime tagging stay aligned across deploys
  // that don't bump the package.json version. Inlined into the client
  // bundle via the `env` block in next.config.js.
  release: process.env.SENTRY_RELEASE ?? appPackage.version,

  tracesSampleRate: 0,
  integrations: (defaults) =>
    defaults.filter((i) => i.name !== "BrowserTracing"),

  debug: false,
  ignoreErrors: [
    "NEXT_HTTP_ERROR_FALLBACK;404",
    "AxiosError",
    "Wrong private key. Master or active or posting private key required.",
    "Network request failed",
    "Failed to read the 'localStorage' property from 'Window'",
    "Invalid parameters",
    "Failed to connect to MetaMask",
    "Cannot set property tron of #<Window> which has only a getter",
    "Cannot set property ethereum of #<Window> which has only a getter",
    "window.ethereum._handleChainChanged is not a function",
    "window[eFuncName] is not a function",
    "Cannot destructure property 'register' of 'undefined' as it is undefined.",
    "CopyDataProperties is not a function"
  ],
  denyUrls: [
    /sui\.js/,
    /extensionServiceWorker\.js$/,
    /chrome-extension:\/\//
  ],

  beforeSend(event) {
    const exceptionType = event.exception?.values?.[0]?.type ?? "";
    const message = event.exception?.values?.[0]?.value ?? "";
    const stackStr = JSON.stringify(
      event.exception?.values?.[0]?.stacktrace?.frames ?? []
    );

    // AbortController-induced timeouts (TimeoutError / AbortError) ship
    // with no stack frames, so we can't tell which fetch is at fault.
    // Walk recent breadcrumbs for the last in-flight fetch URL and tag
    // the event so we can correlate timeouts to specific endpoints.
    // Trigger only on the canonical AbortController error names plus the
    // standard "signal timed out" phrase — a broader /aborted/i match
    // would also tag unrelated paths (transaction aborts, stream aborts).
    if (
      (exceptionType === "TimeoutError" ||
        exceptionType === "AbortError" ||
        /signal timed out/i.test(message)) &&
      !event.tags?.timeoutUrl
    ) {
      const crumbs = event.breadcrumbs ?? [];
      for (let i = crumbs.length - 1; i >= 0; i--) {
        const c = crumbs[i];
        const rawUrl = (c.data as { url?: string } | undefined)?.url;
        if (
          (c.category === "fetch" || c.category === "xhr") &&
          typeof rawUrl === "string"
        ) {
          // Strip query/hash before tagging — request URLs can carry
          // tokens or identifiers we don't want as searchable telemetry.
          let safeUrl: string;
          try {
            const parsed = new URL(rawUrl, window.location.origin);
            safeUrl = `${parsed.origin}${parsed.pathname}`;
          } catch {
            safeUrl = rawUrl.split(/[?#]/)[0] ?? "";
          }
          if (safeUrl) {
            event.tags = { ...event.tags, timeoutUrl: safeUrl.slice(0, 200) };
          }
          break;
        }
      }
    }

    // React SSR streaming hydration issue triggered by browser extensions
    // ($RS is React's internal resumable script marker)
    // Covers old Chrome ≤116 ("Cannot read property 'parentNode' of null"),
    // new Chrome 117+ ("Cannot read properties of null (reading 'parentNode')"),
    // Firefox ("can't access property \"parentNode\", a is null"), and
    // Safari ("null is not an object (evaluating 'a.parentNode')") phrasings.
    const isParentNodeNull =
      message.includes("reading 'parentNode'") ||
      message.includes("property 'parentNode'") ||
      message.includes('"parentNode"') ||
      /null is not an object \(evaluating '[a-z]\.parentNode'\)/.test(message);
    if (isParentNodeNull && stackStr.includes("$RS")) {
      return null;
    }

    // Firefox-specific iframe teardown error following a React hydration
    // mismatch (#418) on profile pages. Symptom — when hydration fails,
    // React tears down the tree and an iframe's contentWindow becomes null
    // while some downstream code still tries to access .document on it.
    // V8-based engines produce a different message for the same access
    // (`Cannot read properties of null (reading 'document')`) so matching
    // on the Firefox phrasing alone is engine-specific, but we *also*
    // require browser=Firefox and a profile-page URL so unrelated iframe
    // bugs in other surfaces aren't silently dropped. Sample 1% to keep
    // trend visibility.
    // TODO(hydration): investigate Firefox-only hydration drift on profile
    // pages (`/@user/...`) — likely a locale/Date/Intl mismatch or a value
    // that differs between SSR and the first client render.
    // event.contexts is loosely typed by @sentry/types; coerce to string.
    const browserName = String(event.contexts?.browser?.name ?? "");
    const url = String(event.request?.url ?? "");
    if (
      message.includes("can't access property \"document\"") &&
      message.includes("contentWindow is null") &&
      /Firefox/i.test(browserName) &&
      /\/@/.test(url) &&
      Math.random() > 0.01
    ) {
      return null;
    }

    // Chrome botnet traffic - null/undefined document access from synthetic handler
    if (
      /Cannot read properties of (null|undefined) \(reading 'document'\)/.test(
        message
      ) &&
      stackStr.includes("HTMLDocument.c")
    ) {
      return null;
    }

    // Network issues corrupting JS chunk downloads
    if (
      /^SyntaxError/.test(event.exception?.values?.[0]?.type ?? "") &&
      /Unexpected (end of input|token)/.test(message) &&
      /chunks?[/\\-]/.test(stackStr)
    ) {
      return null;
    }

    return event;
  }
};

if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
  // Buffer errors that happen before Sentry initializes
  const earlyErrors: { error: unknown; timestamp: number }[] = [];
  const earlyHandler = (event: ErrorEvent) => {
    earlyErrors.push({ error: event.error, timestamp: Date.now() });
  };
  const earlyRejectionHandler = (event: PromiseRejectionEvent) => {
    earlyErrors.push({ error: event.reason, timestamp: Date.now() });
  };
  window.addEventListener("error", earlyHandler);
  window.addEventListener("unhandledrejection", earlyRejectionHandler);

  const init = () => {
    // Remove early listeners before Sentry hooks its own
    window.removeEventListener("error", earlyHandler);
    window.removeEventListener("unhandledrejection", earlyRejectionHandler);

    try {
      Sentry.init(SENTRY_CONFIG);
      Sentry.setTag("source", "client");

      // Flush buffered errors
      for (const { error } of earlyErrors) {
        Sentry.captureException(error);
      }
    } catch (e) {
      console.warn("Sentry init failed, error tracking disabled:", e);
    }
  };

  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(init, { timeout: 5000 });
  } else {
    setTimeout(init, 3000);
  }
} else {
  try {
    Sentry.init(SENTRY_CONFIG);
    Sentry.setTag("source", "client");
  } catch (e) {
    console.warn("Sentry init failed, error tracking disabled:", e);
  }
}
