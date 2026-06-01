"use client";

import { useEffect } from "react";

// Message patterns for a failed chunk / dynamic import — a stale cache or a
// just-replaced build handing the client a chunk that no longer exists.
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

// The webpack runtime was handed an undefined module factory: a chunk loaded but
// references a module id the running runtime doesn't have — a build/version
// mismatch after a deploy ("Cannot read properties of undefined (reading 'call')"
// thrown from webpack-*.js, or the Safari equivalent). Require the webpack
// runtime frame so this never fires on unrelated ".call of undefined" app bugs.
function isWebpackFactoryError(error: { message?: string; stack?: string }): boolean {
  const stack = error.stack ?? "";
  const fromWebpackRuntime =
    /webpack-[0-9a-f]+\.js/i.test(stack) || /webpack-internal/i.test(stack);
  if (!fromWebpackRuntime) {
    return false;
  }
  const message = error.message ?? "";
  return (
    /Cannot read propert(?:y|ies) of undefined \(reading 'call'\)/i.test(message) || // Chrome
    /undefined is not an object \(evaluating '[^']*\.call'\)/i.test(message) || // Safari
    /can't access property ['"]?call['"]?/i.test(message) || // Firefox
    /'call' of undefined/i.test(message)
  );
}

// True when the error indicates the client is running a build that no longer
// matches what the server serves (chunk-load failures + webpack factory
// mismatches). The cure is to reload onto the current build.
export function isDeploySkewError(error: unknown): boolean {
  if (typeof error === "string") {
    return isChunkLoadError(error);
  }
  if (!error || typeof error !== "object") {
    return false;
  }
  const e = error as { message?: string; stack?: string };
  return isChunkLoadError(e.message) || isWebpackFactoryError(e);
}

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
