"use client";
import { useTransferToVesting } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useTransferToVestingMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useTransferToVesting(username, { adapter });
}
