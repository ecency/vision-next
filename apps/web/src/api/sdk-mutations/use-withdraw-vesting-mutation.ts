"use client";
import { useWithdrawVesting } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useWithdrawVestingMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useWithdrawVesting(activeUser?.username, { adapter });
}
