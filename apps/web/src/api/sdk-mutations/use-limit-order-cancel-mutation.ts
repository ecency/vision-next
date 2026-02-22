"use client";

import { useLimitOrderCancel } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useLimitOrderCancelMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useLimitOrderCancel(username, { adapter });
}
