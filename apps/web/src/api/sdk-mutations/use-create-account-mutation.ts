"use client";

import { useCreateAccount } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useCreateAccountMutation() {
  const { activeUser } = useActiveAccount();
  const username = activeUser?.username;
  const adapter = createWebBroadcastAdapter();

  return useCreateAccount(username, { adapter });
}
