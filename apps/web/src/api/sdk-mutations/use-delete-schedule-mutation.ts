"use client";

import { useDeleteSchedule as useSdkDeleteSchedule } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";

export function useDeleteScheduleMutation() {
  const { activeUser } = useActiveAccount();
  const code = activeUser ? getAccessToken(activeUser.username) : undefined;
  return useSdkDeleteSchedule(activeUser?.username, code);
}
