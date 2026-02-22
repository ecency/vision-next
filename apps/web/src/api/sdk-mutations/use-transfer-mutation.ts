"use client";
import { useTransfer } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useTransferMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useTransfer(username, { adapter });
}
