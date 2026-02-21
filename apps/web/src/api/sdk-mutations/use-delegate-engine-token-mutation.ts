"use client";
import { useDelegateEngineToken } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useDelegateEngineTokenMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useDelegateEngineToken(username, { adapter });
}
