"use client";

import { useMoveSchedule as useSdkMoveSchedule } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";

export function useMoveScheduleMutation() {
  const { activeUser } = useActiveAccount();
  const code = activeUser ? getAccessToken(activeUser.username) : undefined;
  return useSdkMoveSchedule(activeUser?.username, code);
}
