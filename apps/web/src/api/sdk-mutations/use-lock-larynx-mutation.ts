"use client";
import { useLockLarynx } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useLockLarynxMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useLockLarynx(username, { adapter });
}
