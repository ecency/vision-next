"use client";

import { useLimitOrderCreate } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useLimitOrderCreateMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useLimitOrderCreate(username, { adapter });
}
