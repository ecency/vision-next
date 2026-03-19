"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

const IMAGE_HOST = "images.ecency.com";
const REPORT_SAMPLE_RATE = 0.2;
const DEBOUNCE_MS = 5000;

const recentlyReported = new Set<string>();

export function ImageFailureTracker() {
  useEffect(() => {
    const handler = (event: Event) => {
      const el = event.target;
      if (!(el instanceof HTMLImageElement)) return;

      const src = el.src || el.currentSrc;
      if (!src || !src.includes(IMAGE_HOST)) return;

      if (Math.random() > REPORT_SAMPLE_RATE) return;

      // Deduplicate rapid failures for same URL
      const key = src.slice(0, 200);
      if (recentlyReported.has(key)) return;
      recentlyReported.add(key);
      setTimeout(() => recentlyReported.delete(key), DEBOUNCE_MS);

      Sentry.withScope((scope) => {
        scope.setTag("failure_type", "image_load");
        scope.setTag("image_host", IMAGE_HOST);
        scope.setLevel("warning");
        scope.setExtras({
          image_src: src,
          page_url: window.location.href,
          connection_type: (navigator as any).connection?.effectiveType,
          online: navigator.onLine
        });
        Sentry.captureMessage("Client image load failure: " + IMAGE_HOST);
      });
    };

    // Capture phase to catch errors on <img> elements (they don't bubble)
    document.addEventListener("error", handler, true);
    return () => document.removeEventListener("error", handler, true);
  }, []);

  return null;
}
