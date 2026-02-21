"use client";
import { usePowerLarynx } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function usePowerLarynxMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return usePowerLarynx(username, { adapter });
}
