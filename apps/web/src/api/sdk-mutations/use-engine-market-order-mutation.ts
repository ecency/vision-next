"use client";
import { useEngineMarketOrder } from "@ecency/sdk";
import { createWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";

export function useEngineMarketOrderMutation() {
  const { activeUser } = useActiveAccount();
  const adapter = createWebBroadcastAdapter();
  return useEngineMarketOrder(activeUser?.username, { adapter });
}
