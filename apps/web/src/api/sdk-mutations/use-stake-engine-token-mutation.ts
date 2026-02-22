"use client";
import { useStakeEngineToken } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useStakeEngineTokenMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useStakeEngineToken(username, { adapter });
}
