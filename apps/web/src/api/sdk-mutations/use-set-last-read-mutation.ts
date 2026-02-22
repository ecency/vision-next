"use client";

import { useSetLastRead } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useSetLastReadMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useSetLastRead(username, { adapter });
}
