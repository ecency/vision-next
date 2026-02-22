"use client";
import { useTransferLarynx } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useTransferLarynxMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useTransferLarynx(username, { adapter });
}
