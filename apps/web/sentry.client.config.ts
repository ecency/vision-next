// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import appPackage from "./package.json";

Sentry.init({
  dsn: "https://8a5c1659d1c2ba3385be28dc7235ce56@o4507985141956608.ingest.de.sentry.io/4507985146609744",

  enabled: process.env.NODE_ENV === "production",
  release: appPackage.version,

  // Disable performance tracing to reduce client bundle size (~100-150 KB).
  // Only error/exception capture is needed for our use case.
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
    "Cannot destructure property 'register' of 'undefined' as it is undefined.",
    // iOS Safari cross-origin security errors from post-renderer library
    "null is not an object (evaluating 'a.parentNode')",
    "null is not an object (evaluating 'b.parentNode')",
    "null is not an object (evaluating 'c.parentNode')"
  ],
  // Filter out errors originating from browser extension
  denyUrls: [
    /sui\.js/,
    /extensionServiceWorker\.js$/,
    /chrome-extension:\/\//
  ]
});
Sentry.setTag("source", "client");
