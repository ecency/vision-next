"use client";
import { useEngineMarketOrder } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useEngineMarketOrderMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();
  return useEngineMarketOrder(username, { adapter });
}
