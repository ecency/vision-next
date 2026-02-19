"use client";
import { useStakeEngineToken } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useStakeEngineTokenMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useStakeEngineToken(activeUser?.username, { adapter });
}
