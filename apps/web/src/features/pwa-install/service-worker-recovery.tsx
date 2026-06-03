"use client";

import { useEffect } from "react";
import { isChunkLoadError, isDeploySkewError } from "@/utils/deploy-skew";

// Re-exported so existing consumers (global-error.tsx, SentryErrorBoundary) keep
// importing the skew matchers from here; the implementations now live in the
// React-free @/utils/deploy-skew so the Sentry client config can share them too.
export { isChunkLoadError, isDeploySkewError } from "@/utils/deploy-skew";

// Guards against reload loops: at most one recovery reload per tab session. If
// the page still errors after the reload, we stop and let the error boundary
// render its fallback rather than refreshing forever.
const RELOAD_FLAG = "deploy-skew-recovery-reloaded";

export function reloadForSkew() {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG)) {
      return;
    }
    sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    // sessionStorage unusable (private mode / quota) — without a persisted guard
    // we can't prove we haven't already reloaded this session, so do NOT reload.
    // A stuck page (the React error boundary renders its fallback) is far better
    // than an infinite reload loop.
    return;
  }
  window.location.reload();
}

// Guards a controllerchange reload against firing twice within one page load.
let controllerReloadStarted = false;

/**
 * Recovers users running a build that no longer matches the server — the cause
 * of the post-deploy "Element type is invalid: undefined" / "undefined (reading
 * 'call')" 500s. Renders nothing. Complements Next's `deploymentId` skew
 * protection (which hard-reloads on navigation); this catches the cases that
 * already crashed (stale cached HTML, mid-render mismatch).
 *
 * 1. When a NEW service worker takes control of an already-controlled page
 *    (`controllerchange`), reload once so the in-memory webpack runtime matches
 *    the freshly-cached chunks. Only armed when the page already had a
 *    controller at mount — otherwise the upcoming `controllerchange` is just the
 *    initial `clientsClaim` on a first visit and a reload would be spurious.
 * 2. As a safety net, reload once (per session) on an uncaught deploy-skew error
 *    (chunk-load failure or webpack factory mismatch).
 */
export function ServiceWorkerRecovery() {
  useEffect(() => {
    // Capture the container up front so cleanup detaches from the same object,
    // not whatever `navigator.serviceWorker` happens to be later.
    const swContainer =
      typeof navigator !== "undefined" && "serviceWorker" in navigator
        ? navigator.serviceWorker
        : null;

    const onControllerChange = () => {
      if (controllerReloadStarted) {
        return;
      }
      controllerReloadStarted = true;
      window.location.reload();
    };

    // Only arm when the page already has a controller — otherwise the upcoming
    // controllerchange is just the initial clientsClaim on a first visit and a
    // reload would be spurious.
    const armedForController = !!swContainer && !!swContainer.controller;
    if (armedForController) {
      swContainer!.addEventListener("controllerchange", onControllerChange);
    }

    const onError = (event: ErrorEvent) => {
      if (isDeploySkewError(event.error) || isChunkLoadError(event.message)) {
        reloadForSkew();
      }
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      if (isDeploySkewError(event.reason)) {
        reloadForSkew();
      }
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    return () => {
      if (armedForController && swContainer) {
        swContainer.removeEventListener("controllerchange", onControllerChange);
      }
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
