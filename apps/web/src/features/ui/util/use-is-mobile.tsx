"use client";

import { useSyncExternalStore } from "react";

/** Viewport width (px) below which the app is treated as a mobile browser. */
export const MOBILE_BREAKPOINT = 570;

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener("resize", onStoreChange);
  return () => window.removeEventListener("resize", onStoreChange);
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT;
}

// Render desktop on the server and the first client commit so SSR and hydration
// always agree; the real viewport value is applied right after mount.
function getServerSnapshot() {
  return false;
}

/**
 * SSR-safe viewport check — `true` below {@link MOBILE_BREAKPOINT}px.
 *
 * This is the single, canonical mobile-detection hook for the app. It returns
 * `false` during SSR and the first client render (so hydration never
 * mismatches), then reflects the real viewport width and updates on resize —
 * with no leaked listeners.
 *
 * It replaces the former global `isMobile` Zustand flag, which had no writer and
 * was therefore permanently `false`, silently disabling every mobile-only UI
 * branch that depended on it.
 */
export function useIsMobile() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
