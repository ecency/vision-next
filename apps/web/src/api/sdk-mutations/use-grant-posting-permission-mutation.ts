"use client";

import { useGrantPostingPermission } from "@ecency/sdk";
import { getWebBroadcastAdapter } from "@/providers/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";

export function useGrantPostingPermissionMutation() {
  const username = useActiveUsername();
  const adapter = getWebBroadcastAdapter();

  return useGrantPostingPermission(username, { adapter });
}
