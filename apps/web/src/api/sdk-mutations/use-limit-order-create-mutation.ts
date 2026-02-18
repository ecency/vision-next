"use client";

import { useLimitOrderCreate } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useLimitOrderCreateMutation() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const adapter = createWebBroadcastAdapter();

  return useLimitOrderCreate(username, { adapter });
}
