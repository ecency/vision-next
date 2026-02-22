"use client";
import { useConvert } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useConvertMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useConvert(username, { adapter });
}
