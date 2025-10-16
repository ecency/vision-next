import { getAccountFullQuery } from "@/api/queries";
import { useGlobalStore } from "@/core/global-store";
import { initI18next } from "@/features/i18n";
import * as ls from "@/utils/local-storage";
import Cookies from "js-cookie";
import { useEffect } from "react";
import { client } from "@/api/hive";
import { ConfigManager } from "@ecency/sdk";
import { useQueryClient } from "@tanstack/react-query";
import { useMount } from "react-use";

export function ClientInit() {
  const activeUser = useGlobalStore((s) => s.activeUser);
  const setActiveUser = useGlobalStore((state) => state.setActiveUser);
  const updateActiveUser = useGlobalStore((state) => state.updateActiveUser);
  const initKeychain = useGlobalStore((state) => state.initKeychain);
  const loadUsers = useGlobalStore((state) => state.loadUsers);

  const queryClient = useQueryClient();

  const { data } = getAccountFullQuery(activeUser?.username).useClientQuery();

  useMount(() => {
    ConfigManager.setQueryClient(queryClient as any);

    initKeychain();
    initI18next();
    loadUsers();

    (window as any).dHiveClient = client;

    const activeUsername = ls.get("active_user") ?? Cookies.get("active_user");
    if (activeUsername) {
      setActiveUser(activeUsername);
    }

    // Setup global error handler for ChunkLoadError
    setupChunkLoadErrorHandler();
  });

  useEffect(() => {
    if (data) {
      updateActiveUser(data);
    }
  }, [data, updateActiveUser]);

  return <></>;
}

/**
 * Sets up a global error handler to catch ChunkLoadError exceptions
 * which occur when the user has a stale service worker or cached HTML
 * that references JavaScript chunks from a previous deployment.
 * 
 * When detected, we reload the page once to fetch the new version.
 */
function setupChunkLoadErrorHandler() {
  if (typeof window === "undefined") return;

  const RELOAD_KEY = "chunk_reload_attempted";
  const RELOAD_EXPIRY = 30000; // 30 seconds

  window.addEventListener("error", (event) => {
    const error = event.error;
    
    // Check if this is a ChunkLoadError
    const isChunkLoadError =
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Failed to fetch dynamically imported module");

    if (isChunkLoadError) {
      console.error("[ChunkLoadError] Detected chunk load failure:", error);

      // Check if we've recently tried to reload
      const lastReloadAttempt = sessionStorage.getItem(RELOAD_KEY);
      const now = Date.now();

      if (lastReloadAttempt) {
        const timeSinceReload = now - parseInt(lastReloadAttempt, 10);
        if (timeSinceReload < RELOAD_EXPIRY) {
          console.warn(
            `[ChunkLoadError] Recently reloaded ${timeSinceReload}ms ago, not reloading again`
          );
          return;
        }
      }

      // Mark that we're about to reload
      sessionStorage.setItem(RELOAD_KEY, now.toString());

      console.log("[ChunkLoadError] Reloading page to fetch new chunks...");

      // Clear all caches and reload
      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            console.log(`[ChunkLoadError] Deleting cache: ${name}`);
            caches.delete(name);
          });
        }).finally(() => {
          // Force a hard reload to bypass any cache
          window.location.reload();
        });
      } else {
        // If Cache API not available, just reload
        window.location.reload();
      }

      // Prevent the error from propagating
      event.preventDefault();
    }
  });

  // Also listen for unhandled promise rejections (dynamic imports)
  window.addEventListener("unhandledrejection", (event) => {
    const error = event.reason;

    const isChunkLoadError =
      error?.name === "ChunkLoadError" ||
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("Failed to fetch dynamically imported module");

    if (isChunkLoadError) {
      console.error("[ChunkLoadError] Detected chunk load failure in promise:", error);

      const lastReloadAttempt = sessionStorage.getItem(RELOAD_KEY);
      const now = Date.now();

      if (lastReloadAttempt) {
        const timeSinceReload = now - parseInt(lastReloadAttempt, 10);
        if (timeSinceReload < RELOAD_EXPIRY) {
          console.warn(
            `[ChunkLoadError] Recently reloaded ${timeSinceReload}ms ago, not reloading again`
          );
          return;
        }
      }

      sessionStorage.setItem(RELOAD_KEY, now.toString());
      console.log("[ChunkLoadError] Reloading page to fetch new chunks...");

      if ("caches" in window) {
        caches.keys().then((names) => {
          names.forEach((name) => {
            console.log(`[ChunkLoadError] Deleting cache: ${name}`);
            caches.delete(name);
          });
        }).finally(() => {
          window.location.reload();
        });
      } else {
        window.location.reload();
      }

      event.preventDefault();
    }
  });
}
