"use client";

import { useEffect } from "react";
import { useGlobalStore } from "@/core/global-store";
import * as ls from "@/utils/local-storage";
import { getQueryClient } from "@/core/react-query";
import { startQueryCachePersistence } from "@/core/react-query/persist";

/**
 * Arms cross-load query persistence for whoever is signed in, and re-arms on an
 * account switch so one reader's feed is never restored under another's name.
 * Renders nothing.
 */
export function QueryCachePersistence() {
  const activeUsername = useGlobalStore((state) => state.activeUser?.username ?? null);

  useEffect(() => {
    // The store fills `activeUser` from localStorage after the first render, so
    // read the stored name directly rather than arming as anonymous and
    // switching a tick later: the load where a restore matters most is the one
    // that would have missed it.
    const user = activeUsername ?? (ls.get("active_user") as string | null) ?? null;
    return startQueryCachePersistence(getQueryClient(), user);
  }, [activeUsername]);

  return null;
}
