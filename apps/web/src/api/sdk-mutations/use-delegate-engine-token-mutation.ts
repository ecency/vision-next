"use client";
import { useDelegateEngineToken } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useDelegateEngineTokenMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useDelegateEngineToken(activeUser?.username, { adapter });
}
