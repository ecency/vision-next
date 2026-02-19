"use client";
import { useTransferEngineToken } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useTransferEngineTokenMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useTransferEngineToken(activeUser?.username, { adapter });
}
