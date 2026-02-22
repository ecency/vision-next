"use client";
import { useMarkNotificationsRead } from "@ecency/sdk";
import { useActiveUsername } from "@/core/hooks/use-active-username";
import { getAccessToken } from "@/utils";

export function useMarkNotificationsMutation(
  onSuccess?: (unreadCount?: number) => void,
  onError?: (e: Error) => void
) {
  const username = useActiveUsername();
  const code = username ? getAccessToken(username) : undefined;
  return useMarkNotificationsRead(username, code, onSuccess, onError);
}
