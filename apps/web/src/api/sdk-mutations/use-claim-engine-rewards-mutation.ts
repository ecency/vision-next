"use client";
import { useClaimEngineRewards } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useClaimEngineRewardsMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useClaimEngineRewards(username, { adapter });
}
