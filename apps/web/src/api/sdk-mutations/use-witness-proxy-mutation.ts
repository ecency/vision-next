"use client";

import { useWitnessProxy } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useWitnessProxyMutation() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const adapter = createWebBroadcastAdapter();

  return useWitnessProxy(username, { adapter });
}
