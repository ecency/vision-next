"use client";
import { useClaimInterest } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useClaimInterestMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useClaimInterest(username, { adapter });
}
