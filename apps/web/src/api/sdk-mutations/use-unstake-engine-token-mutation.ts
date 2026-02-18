"use client";
import { useUnstakeEngineToken } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useUnstakeEngineTokenMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useUnstakeEngineToken(activeUser?.username, { adapter });
}
