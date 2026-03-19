"use client";

import { useEffect } from "react";
import { setProxyBase } from "@ecency/render-helper";
import * as Sentry from "@sentry/nextjs";

const PRIMARY_HOST = "images.ecency.com";
const FALLBACK_HOST = "img.ecency.com";
const FALLBACK_THRESHOLD = 3;
const PROBE_TIMEOUT_MS = 4000;
const SESSION_KEY = "image_proxy_fallback_active";

const failedUrls = new Set<string>();
const retriedUrls = new Set<string>();
let globalSwitched = false;

/** @internal Reset module state for tests */
export function _resetImageProxyFallback() {
  failedUrls.clear();
  retriedUrls.clear();
  globalSwitched = false;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

function rewriteBackgroundImages() {
  document.querySelectorAll<HTMLElement>(`[style*="${PRIMARY_HOST}"]`).forEach((el) => {
    if (el.style.backgroundImage) {
      el.style.backgroundImage = el.style.backgroundImage.replaceAll(PRIMARY_HOST, FALLBACK_HOST);
    }
  });
}

function switchToFallback() {
  if (globalSwitched) return;
  globalSwitched = true;

  setProxyBase(`https://${FALLBACK_HOST}`);
  try {
    sessionStorage.setItem(SESSION_KEY, "1");
  } catch {}

  // Fix already-rendered CSS background images (avatars, covers)
  rewriteBackgroundImages();

  Sentry.withScope((scope) => {
    scope.setTag("failure_type", "image_proxy_fallback");
    scope.setLevel("warning");
    scope.setExtras({
      failed_count: failedUrls.size,
      page_url: window.location.href,
      connection_type: (navigator as Navigator & { connection?: { effectiveType?: string } })
        .connection?.effectiveType,
      online: navigator.onLine
    });
    Sentry.captureMessage(`Image proxy fallback activated: ${PRIMARY_HOST} -> ${FALLBACK_HOST}`);
  });
}

export function ImageFailureTracker() {
  // Synchronous check during render — applies fallback before any effects fire.
  // This ensures setProxyBase is called before ClientInit or any component renders images.
  if (typeof window !== "undefined") {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1" && !globalSwitched) {
        setProxyBase(`https://${FALLBACK_HOST}`);
        globalSwitched = true;
      }
    } catch {}
  }

  useEffect(() => {
    // Background probe: try loading a small known image from primary
    if (!globalSwitched) {
      const img = new Image();
      const timeout = setTimeout(() => {
        img.src = "";
        switchToFallback();
      }, PROBE_TIMEOUT_MS);

      img.onload = () => {
        clearTimeout(timeout);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        switchToFallback();
      };
      img.src = `https://${PRIMARY_HOST}/u/ecency/avatar/small`;
    }

    // Runtime error handler: catch individual <img> failures and retry with fallback
    const handler = (event: Event) => {
      const el = event.target;
      if (!(el instanceof HTMLImageElement)) return;

      const src = el.src || el.currentSrc;
      if (!src || !src.includes(PRIMARY_HOST)) return;

      // Already retried this exact URL — don't loop
      if (retriedUrls.has(src)) return;

      // Rewrite this image's src to use fallback immediately
      retriedUrls.add(src);
      el.src = src.replaceAll(PRIMARY_HOST, FALLBACK_HOST);

      // Track unique failures for global switch threshold
      const key = src.slice(0, 200);
      if (!failedUrls.has(key)) {
        failedUrls.add(key);

        if (failedUrls.size >= FALLBACK_THRESHOLD) {
          switchToFallback();
        }
      }
    };

    // Capture phase — img error events don't bubble
    document.addEventListener("error", handler, true);
    return () => document.removeEventListener("error", handler, true);
  }, []);

  return null;
}
