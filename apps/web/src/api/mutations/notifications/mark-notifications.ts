"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";

export function useMarkNotifications() {
  const queryClient = useQueryClient();
  const { activeUser } = useActiveAccount();

  return useMutation({
    mutationKey: ["notifications", "mark"],
    mutationFn: ({ id }: { id: string | undefined }) => {
      if (!activeUser) {
        throw new Error("[Notificaitons] Attempted to mark as read w/o active user");
      }

      const data: { code: string | undefined; id?: string } = {
        code: getAccessToken(activeUser.username)
      };
      if (id) {
        data.id = id;
      }

      return appAxios.post(apiBase(`/private-api/notifications/mark`), data);
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
