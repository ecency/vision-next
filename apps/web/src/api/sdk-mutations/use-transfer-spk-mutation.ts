"use client";
import { useTransferSpk } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useTransferSpkMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useTransferSpk(username, { adapter });
}
