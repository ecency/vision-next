"use client";
import { useUndelegateEngineToken } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useUndelegateEngineTokenMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useUndelegateEngineToken(username, { adapter });
}
