"use client";
import { useClaimEngineRewards } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useClaimEngineRewardsMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useClaimEngineRewards(activeUser?.username, { adapter });
}
