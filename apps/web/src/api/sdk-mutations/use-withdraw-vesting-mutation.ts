"use client";
import { useWithdrawVesting } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useWithdrawVestingMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useWithdrawVesting(username, { adapter });
}
