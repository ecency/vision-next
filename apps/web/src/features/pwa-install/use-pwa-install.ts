"use client";

import { useCallback, useSyncExternalStore } from "react";

// Subset of the BeforeInstallPromptEvent interface (not in lib.dom.d.ts).
// See https://web.dev/articles/customize-install
interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

interface PwaInstallSnapshot {
  deferredPrompt: BeforeInstallPromptEvent | null;
  installed: boolean;
}

// Module-level state. The listeners below are attached once when this module
// is first imported on the client, so the captured beforeinstallprompt event
// is preserved across client-side navigations. Any consumer mounted *after*
// the event fires still observes the latest snapshot via useSyncExternalStore.
let snapshot: PwaInstallSnapshot = { deferredPrompt: null, installed: false };
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

function setSnapshot(updates: Partial<PwaInstallSnapshot>) {
  snapshot = { ...snapshot, ...updates };
  notify();
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari exposes a non-standard property instead of display-mode.
  return (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

// Attach listeners exactly once at module import time. This module is client-
// only ("use client"), and the guard prevents duplicate attachment if the file
// is re-imported during HMR.
const INITIALIZED_FLAG = "__ecencyPwaInstallInitialized";
type GlobalWithFlag = typeof globalThis & { [INITIALIZED_FLAG]?: boolean };

if (typeof window !== "undefined" && !(globalThis as GlobalWithFlag)[INITIALIZED_FLAG]) {
  (globalThis as GlobalWithFlag)[INITIALIZED_FLAG] = true;

  // If the page loads into an already-installed PWA, mark immediately so
  // CTAs hide without a flicker.
  if (detectStandalone()) {
    snapshot = { deferredPrompt: null, installed: true };
  }

  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    setSnapshot({ deferredPrompt: e as BeforeInstallPromptEvent });
  });

  window.addEventListener("appinstalled", () => {
    setSnapshot({ deferredPrompt: null, installed: true });
  });
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function getSnapshot(): PwaInstallSnapshot {
  return snapshot;
}

// Server snapshot must be a stable reference to avoid hydration mismatches.
const SERVER_SNAPSHOT: PwaInstallSnapshot = { deferredPrompt: null, installed: false };
function getServerSnapshot(): PwaInstallSnapshot {
  return SERVER_SNAPSHOT;
}

export interface UsePwaInstallResult {
  /** Whether a native install prompt is ready to be shown. */
  canInstall: boolean;
  /** Whether the app is already running in standalone/installed mode. */
  installed: boolean;
  /**
   * Trigger the native install prompt. Resolves with "accepted", "dismissed",
   * or "unavailable" if no prompt is currently stashed.
   */
  install: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

export function usePwaInstall(): UsePwaInstallResult {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const install = useCallback(async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
    const event = snapshot.deferredPrompt;
    if (!event) return "unavailable";
    await event.prompt();
    const { outcome } = await event.userChoice;
    // The event can only be used once; clear the stashed reference.
    setSnapshot({ deferredPrompt: null });
    return outcome;
  }, []);

  return {
    canInstall: state.deferredPrompt !== null && !state.installed,
    installed: state.installed,
    install
  };
}
