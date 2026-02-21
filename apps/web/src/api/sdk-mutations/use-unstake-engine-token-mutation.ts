"use client";
import { useUnstakeEngineToken } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useUnstakeEngineTokenMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useUnstakeEngineToken(username, { adapter });
}
