"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { broadcastPostingOperations, formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Entry } from "@/entities";
import { error } from "@/features/shared";
import { Operation } from "@hiveio/dhive";
import { SortOrder } from "@/enums";

export function useDeleteComment(entry: Entry, onSuccess: () => void, parent?: Entry) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["deleteComment", activeUser?.username, entry?.id],
    mutationFn: () => {
      if (!activeUser) {
        throw new Error("Active user not found");
      }

      const params = {
        author: entry.author,
        permlink: entry.permlink
      };

      const opArray: Operation[] = [["delete_comment", params]];

      return broadcastPostingOperations(activeUser.username, opArray);
    },
    onError: (err) => error(...formatError(err)),
    onSuccess: () => {
      if (parent && activeUser) {
        const previousReplies =
          queryClient.getQueryData<Entry[]>([
            "posts",
            "discussions",
            parent.author,
            parent.permlink,
            SortOrder.created,
            activeUser.username
          ]) ?? [];
        queryClient.setQueryData(
          [
            "posts",
            "discussions",
            parent.author,
            parent.permlink,
            SortOrder.created,
            activeUser.username
          ],
          [
            ...previousReplies.filter(
              (r) => r.author !== entry.author || r.permlink !== entry.permlink
            )
          ]
        );
      }

      onSuccess();
    }
  });
}
