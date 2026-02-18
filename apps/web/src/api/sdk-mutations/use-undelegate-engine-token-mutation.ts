"use client";
import { useUndelegateEngineToken } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useUndelegateEngineTokenMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useUndelegateEngineToken(activeUser?.username, { adapter });
}
