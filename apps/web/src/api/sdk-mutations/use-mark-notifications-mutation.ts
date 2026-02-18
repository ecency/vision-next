"use client";
import { useMarkNotificationsRead } from "@ecency/sdk";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";

export function useMarkNotificationsMutation(
  onSuccess?: (unreadCount?: number) => void,
  onError?: (e: Error) => void
) {
  const { activeUser } = useActiveAccount();
  const code = activeUser ? getAccessToken(activeUser.username) : undefined;
  return useMarkNotificationsRead(activeUser?.username, code, onSuccess, onError);
}
