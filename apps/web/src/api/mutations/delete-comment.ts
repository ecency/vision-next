"use client";

import { useMutation } from "@tanstack/react-query";
import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Entry } from "@/entities";
import { error, success } from "@/features/shared";
import { useDeleteCommentMutation } from "@/api/sdk-mutations";
import i18next from "i18next";

/**
 * Web wrapper for delete comment mutation.
 * SDK now handles optimistic removal + rollback for discussions cache.
 * This wrapper adds web-specific feedback (toasts) and success callback.
 */
export function useDeleteComment(entry: Entry, onSuccess: () => void, parent?: Entry) {
  const { activeUser } = useActiveAccount();
  const { mutateAsync: sdkDeleteComment } = useDeleteCommentMutation();

  return useMutation({
    mutationKey: ["deleteComment", activeUser?.username, entry?.id],
    mutationFn: async () => {
      if (!activeUser) {
        throw new Error("Active user not found");
      }

      await sdkDeleteComment({
        author: entry.author,
        permlink: entry.permlink,
        parentAuthor: entry.parent_author,
        parentPermlink: entry.parent_permlink,
        rootAuthor: parent?.author || entry.parent_author,
        rootPermlink: parent?.permlink || entry.parent_permlink,
      });

      success(i18next.t("comment.delete-success"));
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err) => {
      const errorMessage = formatError(err);
      error(errorMessage[0], errorMessage[1] || i18next.t("comment.delete-error-hint"));
    },
  });
}
