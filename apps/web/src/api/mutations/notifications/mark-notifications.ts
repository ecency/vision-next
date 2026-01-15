"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { markNotifications } from "@ecency/sdk";
import { getAccessToken } from "@/utils";

export function useMarkNotifications() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["notifications", "mark"],
    mutationFn: ({ id }: { id: string | undefined }) => {
      if (!activeUser) {
        throw new Error("[Notificaitons] Attempted to mark as read w/o active user");
      }

      return markNotifications(getAccessToken(activeUser.username), id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread", activeUser?.username]
      });
      queryClient.invalidateQueries({
        queryKey: ["notifications", activeUser?.username]
      });
    }
  });
}
