"use client";
import { useTransfer } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useTransferMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useTransfer(activeUser?.username, { adapter });
}
