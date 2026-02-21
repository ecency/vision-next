"use client";

import { useMoveSchedule as useSdkMoveSchedule } from "@ecency/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";
import { getAccessToken } from "@/utils";

export function useMoveScheduleMutation() {
  const username = useActiveUsername();
  const code = username ? getAccessToken(username) : undefined;
  return useSdkMoveSchedule(username, code);
}
