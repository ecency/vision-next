"use client";
import { useTransferFromSavings } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useTransferFromSavingsMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useTransferFromSavings(username, { adapter });
}
