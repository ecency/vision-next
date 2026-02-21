"use client";

import { useCreateAccount } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useCreateAccountMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useCreateAccount(username, { adapter });
}
