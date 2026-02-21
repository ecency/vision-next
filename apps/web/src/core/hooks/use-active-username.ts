"use client";

import { useGlobalStore } from "@/core/global-store";

/**
 * Lightweight hook that returns only the active username from the global store.
 *
 * Unlike useActiveAccount(), this does NOT create a React Query subscription
 * for the full account data. Use this in mutation wrappers and other places
 * where only the username string is needed.
 */
export function useActiveUsername(): string | undefined {
  return useGlobalStore((s) => s.activeUser?.username);
}
