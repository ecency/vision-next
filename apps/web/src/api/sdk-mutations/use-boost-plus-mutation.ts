"use client";

import { useBoostPlus } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useBoostPlusMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useBoostPlus(username, { adapter });
}
