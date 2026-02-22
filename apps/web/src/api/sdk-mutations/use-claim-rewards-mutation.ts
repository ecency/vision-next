"use client";
import { useClaimRewards } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useClaimRewardsMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useClaimRewards(username, { adapter });
}
