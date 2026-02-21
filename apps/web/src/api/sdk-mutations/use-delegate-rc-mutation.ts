"use client";

import { useDelegateRc } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useDelegateRcMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useDelegateRc(username, { adapter });
}
