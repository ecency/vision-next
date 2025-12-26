"use client";

import { useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface DraftTabState {
  tabId: string;
  lastHeartbeat: number;
}

const HEARTBEAT_INTERVAL_MS = 3000; // Write heartbeat every 3 seconds
const STALE_THRESHOLD_MS = 10000; // Consider heartbeat stale after 10 seconds

/**
 * Hook to coordinate multiple tabs editing the same draft.
 * Uses localStorage heartbeat pattern to determine which tab is "active".
 * Only the active tab should auto-save.
 */
export function useDraftTabCoordinator(draftId: string | undefined) {
  const [isActiveTab, setIsActiveTab] = useState(true);
  const tabIdRef = useRef<string>(uuidv4());
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // No coordination needed if no draft ID
    if (!draftId) {
      setIsActiveTab(true);
      return;
    }

    const storageKey = `draft-tab-lock:${draftId}`;
    const tabId = tabIdRef.current;

    // Check if this tab should be active
    const checkActiveStatus = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (!stored) {
          // No other tab has claimed this draft
          setIsActiveTab(true);
          return;
        }

        const state: DraftTabState = JSON.parse(stored);
        const now = Date.now();
        const isStale = now - state.lastHeartbeat > STALE_THRESHOLD_MS;

        // This tab is active if:
        // 1. It's our tabId, OR
        // 2. The stored heartbeat is stale (other tab closed/crashed)
        const shouldBeActive = state.tabId === tabId || isStale;
        setIsActiveTab(shouldBeActive);
      } catch (err) {
        console.warn("Error checking draft tab status:", err);
        setIsActiveTab(true);
      }
    };

    // Write heartbeat if we're the active tab
    const writeHeartbeat = () => {
      try {
        const stored = localStorage.getItem(storageKey);
        const now = Date.now();

        if (!stored) {
          // No one has claimed this draft, claim it
          const state: DraftTabState = { tabId, lastHeartbeat: now };
          localStorage.setItem(storageKey, JSON.stringify(state));
          setIsActiveTab(true);
          return;
        }

        const state: DraftTabState = JSON.parse(stored);
        const isStale = now - state.lastHeartbeat > STALE_THRESHOLD_MS;

        if (state.tabId === tabId || isStale) {
          // We're already active OR we can take over
          const newState: DraftTabState = { tabId, lastHeartbeat: now };
          localStorage.setItem(storageKey, JSON.stringify(newState));
          setIsActiveTab(true);
        } else {
          // Another tab is active
          setIsActiveTab(false);
        }
      } catch (err) {
        console.warn("Error writing draft tab heartbeat:", err);
      }
    };

    // Listen for storage events from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey) {
        checkActiveStatus();
      }
    };

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Tab became visible, check if we should become active
        checkActiveStatus();
      }
    };

    // Initial check and heartbeat
    checkActiveStatus();
    writeHeartbeat();

    // Set up heartbeat interval
    heartbeatIntervalRef.current = setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);

    // Listen for storage events from other tabs
    window.addEventListener("storage", handleStorageChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }

      window.removeEventListener("storage", handleStorageChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);

      // Clear our heartbeat if we're the active tab
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const state: DraftTabState = JSON.parse(stored);
          if (state.tabId === tabId) {
            localStorage.removeItem(storageKey);
          }
        }
      } catch (err) {
        console.warn("Error cleaning up draft tab lock:", err);
      }
    };
  }, [draftId]);

  return { isActiveTab };
}
