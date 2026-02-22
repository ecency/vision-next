"use client";

import { useProposalCreate } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useProposalCreateMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useProposalCreate(username, { adapter });
}
