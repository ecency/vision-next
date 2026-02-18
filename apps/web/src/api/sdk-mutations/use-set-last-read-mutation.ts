"use client";

import { useSetLastRead } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useSetLastReadMutation() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const adapter = createWebBroadcastAdapter();

  return useSetLastRead(username, { adapter });
}
