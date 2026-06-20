"use client";

import { useRcDelegation } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useRcDelegationMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useRcDelegation(username, { adapter });
}
