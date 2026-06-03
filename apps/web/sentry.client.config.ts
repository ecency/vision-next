// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import appPackage from "./package.json";
import { beforeSend } from "./src/utils/sentry-before-send";

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

  // Distinguish staging (alpha) from production. Alpha runs an otherwise
  // identical prod build (same DSN, NODE_ENV=production, often the same commit
  // SHA), so without this label its errors are tagged "production" and trip the
  // prod "Critical errors" alert + eat prod quota. CI stamps SENTRY_ENVIRONMENT
  // per deploy (staging.yml="staging", master.yml="production"); inlined into
  // the client bundle via the `env` block in next.config.js. Defaults to
  // "production" for local/unset builds.
  environment: process.env.SENTRY_ENVIRONMENT ?? "production",

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

  // The single source of truth for client-side event filtering and
  // reclassification (deploy-skew, RC exhaustion, extension noise, timeouts).
  // Extracted to src/utils/sentry-before-send so it stays unit-testable.
  beforeSend
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
