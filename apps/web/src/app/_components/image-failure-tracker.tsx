"use client";

import { useEffect, useLayoutEffect } from "react";
import { setProxyBase } from "@ecency/render-helper";
import * as Sentry from "@sentry/nextjs";
import { ALLOWED_IMAGE_SERVERS } from "@/defaults";

const PRIMARY_HOST = "images.ecency.com";
const FALLBACK_HOST = "img.ecency.com";
const FALLBACK_THRESHOLD = 3;
const PROBE_TIMEOUT_MS = 4000;
const SESSION_KEY = "image_proxy_fallback_active";

const failedUrls = new Set<string>();
let retriedElements = new WeakSet<HTMLImageElement>();
let globalSwitched = false;

/** @internal Reset module state for tests */
export function _resetImageProxyFallback() {
  failedUrls.clear();
  retriedElements = new WeakSet();
  globalSwitched = false;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {}
}

/** Check if the user has explicitly chosen a valid non-default image proxy (e.g. images.hive.blog) */
function hasNonDefaultProxy(): boolean {
  try {
    const raw = localStorage.getItem("image_proxy");
    if (!raw) return false;
    const value = JSON.parse(raw);
    return (
      typeof value === "string" &&
      ALLOWED_IMAGE_SERVERS.includes(value) &&
      value !== `https://${PRIMARY_HOST}`
    );
  } catch {
    return false;
  }
}

function rewriteImageSources() {
  document.querySelectorAll<HTMLImageElement>(`img[src*="${PRIMARY_HOST}"]`).forEach((img) => {
    retriedElements.add(img);
    img.src = img.src.replaceAll(PRIMARY_HOST, FALLBACK_HOST);
  });
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

  // Fix already-rendered <img> elements and CSS background images (avatars, covers)
  rewriteImageSources();
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
  // Skipped when user has explicitly chosen a different proxy (e.g. images.hive.blog).
  if (typeof window !== "undefined") {
    try {
      if (
        !hasNonDefaultProxy() &&
        sessionStorage.getItem(SESSION_KEY) === "1" &&
        !globalSwitched
      ) {
        setProxyBase(`https://${FALLBACK_HOST}`);
        globalSwitched = true;
      }
    } catch {}
  }

  // Rewrite SSR-rendered images on hydration (before paint) to avoid a flash of
  // broken images when the cached fallback is active from a previous navigation.
  // useLayoutEffect runs before the browser paints, so lazy-loaded images below
  // the fold never attempt the blocked primary host.
  useLayoutEffect(() => {
    if (globalSwitched) {
      rewriteImageSources();
      rewriteBackgroundImages();
    }
  }, []);

  useEffect(() => {
    // Background probe: try loading a small known image from primary.
    // Skipped when user has a non-default proxy or fallback is already active.
    let probeTimeout: ReturnType<typeof setTimeout> | undefined;
    let probeImg: HTMLImageElement | undefined;

    if (!globalSwitched && !hasNonDefaultProxy()) {
      probeImg = new Image();
      probeTimeout = setTimeout(() => {
        probeImg!.src = "";
        switchToFallback();
      }, PROBE_TIMEOUT_MS);

      probeImg.onload = () => {
        clearTimeout(probeTimeout);
      };
      probeImg.onerror = () => {
        clearTimeout(probeTimeout);
        switchToFallback();
      };
      probeImg.src = `https://${PRIMARY_HOST}/u/ecency/avatar/small`;
    }

    // Runtime error handler: catch individual <img> failures and retry with fallback
    const handler = (event: Event) => {
      const el = event.target;
      if (!(el instanceof HTMLImageElement)) return;

      const src = el.src || el.currentSrc;
      if (!src || !src.includes(PRIMARY_HOST)) return;

      // Already retried this element — don't loop
      if (retriedElements.has(el)) return;

      // Rewrite this image's src to use fallback immediately
      retriedElements.add(el);
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
    return () => {
      document.removeEventListener("error", handler, true);
      if (probeTimeout) clearTimeout(probeTimeout);
      if (probeImg) {
        probeImg.onload = null;
        probeImg.onerror = null;
        probeImg.src = "";
      }
    };
  }, []);

  return null;
}
