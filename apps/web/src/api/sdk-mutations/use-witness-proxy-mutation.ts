"use client";

import { useWitnessProxy } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useWitnessProxyMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useWitnessProxy(username, { adapter });
}
