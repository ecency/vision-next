"use client";

import { useLimitOrderCancel } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useLimitOrderCancelMutation() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const adapter = createWebBroadcastAdapter();

  return useLimitOrderCancel(username, { adapter });
}
