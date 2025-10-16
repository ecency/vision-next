// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import appPackage from "./package.json";

Sentry.init({
  dsn: "https://8a5c1659d1c2ba3385be28dc7235ce56@o4507985141956608.ingest.de.sentry.io/4507985146609744",

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === "production",

  release: appPackage.version,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
  _experiments: { enableLogs: true },
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
    // Ignore chunk load errors as they are handled by automatic page reload
    "ChunkLoadError",
    "Loading chunk",
    "failed to fetch"
  ],
  // Filter out errors originating from browser extension
  denyUrls: [/sui\.js/],
  
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Check if this is a chunk load error or related error
    if (
      error &&
      (error instanceof Error) &&
      (error.name === "ChunkLoadError" ||
        error.message?.includes("Loading chunk") ||
        error.message?.includes("failed to fetch") ||
        // Also catch the TypeError symptoms that occur after chunk load failure
        (error.message?.includes("null is not an object") && error.message?.includes("parentNode")))
    ) {
      // Trigger a page reload if not already done recently
      const lastReload = sessionStorage.getItem("chunk-error-reload");
      const now = Date.now();
      
      if (!lastReload || now - parseInt(lastReload) > 10000) {
        sessionStorage.setItem("chunk-error-reload", now.toString());
        window.location.reload();
      }
      
      // Don't send this event to Sentry
      return null;
    }
    
    return event;
  }
});
Sentry.setTag("source", "client");
