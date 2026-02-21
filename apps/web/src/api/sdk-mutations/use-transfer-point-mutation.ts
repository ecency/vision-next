"use client";
import { useTransferPoint } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useTransferPointMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useTransferPoint(username, { adapter });
}
