"use client";

import { useEffect } from "react";

// Matches the runtime symptoms of a stale service worker handing a mismatched
// chunk to the running webpack runtime: the dynamic import either fails outright
// (ChunkLoadError / failed module script) or loads a module whose exports don't
// line up. We can only auto-recover the former here; the latter is handled by
// the React error boundaries. Keep this list aligned with what the bundlers /
// browsers actually throw.
export function isChunkLoadError(message?: string | null): boolean {
  if (!message) {
    return false;
  }
  return (
    /ChunkLoadError/i.test(message) ||
    /Loading chunk [\w-]+ failed/i.test(message) ||
    /Loading CSS chunk/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /Failed to fetch dynamically imported module/i.test(message)
  );
}

// Guards against reload loops: at most one chunk-error recovery reload per tab
// session. If the page still errors after the reload, we stop and let the error
// boundary render its fallback rather than refreshing forever.
const CHUNK_RELOAD_FLAG = "sw-chunk-recovery-reloaded";

// Guards a controllerchange reload against firing twice within one page load.
let controllerReloadStarted = false;

function reloadAfterChunkError() {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_FLAG)) {
      return;
    }
    sessionStorage.setItem(CHUNK_RELOAD_FLAG, "1");
  } catch {
    // sessionStorage can throw (private mode / quota); a single reload without
    // the guard is still preferable to a stuck page.
  }
  window.location.reload();
}

/**
 * Recovers users stranded on a stale service worker / mismatched chunks — the
 * cause of the persistent "Element type is invalid: undefined" 500s. Renders
 * nothing.
 *
 * 1. When a NEW service worker takes control of an already-controlled page
 *    (`controllerchange`), reload once so the in-memory webpack runtime matches
 *    the freshly-cached chunks. Only armed when the page already had a
 *    controller at mount — otherwise the upcoming `controllerchange` is just the
 *    initial `clientsClaim` on a first visit and a reload would be spurious.
 * 2. As a safety net, reload once (per session) on a ChunkLoadError / failed
 *    dynamic import, which is what a stale-cache chunk mismatch surfaces as.
 */
export function ServiceWorkerRecovery() {
  useEffect(() => {
    const hasServiceWorker = typeof navigator !== "undefined" && "serviceWorker" in navigator;

    const onControllerChange = () => {
      if (controllerReloadStarted) {
        return;
      }
      controllerReloadStarted = true;
      window.location.reload();
    };

    const armedForController = hasServiceWorker && !!navigator.serviceWorker.controller;
    if (armedForController) {
      navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    }

    const onError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.message) || isChunkLoadError(event.error?.message)) {
        reloadAfterChunkError();
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message = typeof reason === "string" ? reason : reason?.message;
      if (isChunkLoadError(message)) {
        reloadAfterChunkError();
      }
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      if (armedForController) {
        navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      }
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
