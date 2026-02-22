"use client";

import { useDeleteSchedule as useSdkDeleteSchedule } from "@ecency/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";
import { getAccessToken } from "@/utils";

export function useDeleteScheduleMutation() {
  const username = useActiveUsername();
  const code = username ? getAccessToken(username) : undefined;
  return useSdkDeleteSchedule(username, code);
}
