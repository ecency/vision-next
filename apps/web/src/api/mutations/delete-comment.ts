"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatError } from "@/api/operations";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { Entry } from "@/entities";
import { error, success } from "@/features/shared";
import { SortOrder } from "@/enums";
import { useDeleteCommentMutation } from "@/api/sdk-mutations";
import i18next from "i18next";

/**
 * Legacy wrapper for delete comment mutation with optimistic updates.
 * Uses SDK mutation but adds web-specific optimistic UI updates.
 *
 * @param entry - The entry to delete
 * @param onSuccess - Callback to run after successful deletion
 * @param parent - Optional parent entry for cache updates
 *
 * @remarks
 * This wrapper provides optimistic updates for the discussions cache while
 * the SDK mutation handles the blockchain broadcast and broader cache invalidation.
 */
export function useDeleteComment(entry: Entry, onSuccess: () => void, parent?: Entry) {
  const { activeUser } = useActiveAccount();
  const queryClient = useQueryClient();

  // Get SDK mutation
  const { mutateAsync: sdkDeleteComment } = useDeleteCommentMutation();

  // Helper to generate discussions cache key for optimistic updates
  // Only handles SortOrder.created for fast-path optimistic updates
  // SDK's predicate-based invalidation handles ALL sort orders via partial key matching
  const getDiscussionsCacheKey = () =>
    parent && activeUser
      ? ([
          "posts",
          "discussions",
          parent.author,
          parent.permlink,
          SortOrder.created,
          activeUser.username,
        ] as const)
      : null;

  return useMutation({
    mutationKey: ["deleteComment", activeUser?.username, entry?.id],
    mutationFn: async () => {
      if (!activeUser) {
        throw new Error("Active user not found");
      }

      // Build SDK payload with proper root post detection
      // For nested replies (reply to a reply), we need to find the root post
      // entry.parent_author/parent_permlink points to the immediate parent
      // If the parent is also a reply, we should use parent's parent_author/parent_permlink
      // But we don't have that info here, so we use the parent parameter
      const deletePayload = {
        author: entry.author,
        permlink: entry.permlink,
        parentAuthor: entry.parent_author,
        parentPermlink: entry.parent_permlink,
        // For discussions cache invalidation:
        // - If parent is provided, use it (it's the root post in most cases)
        // - Otherwise use entry's parent info
        rootAuthor: parent?.author || entry.parent_author,
        rootPermlink: parent?.permlink || entry.parent_permlink,
      };

      // Use SDK mutation for blockchain broadcast
      // SDK handles:
      // - Broadcasting delete_comment operation
      // - Invalidating parent entry cache
      // - Invalidating discussions cache (all sort orders)
      // - Invalidating feed/blog caches
      await sdkDeleteComment(deletePayload);

      // Show success message
      success(i18next.t("comment.delete-success"));
    },

    onMutate: async () => {
      if (!activeUser || !parent) return;

      // Optimistically remove entry from cache immediately for instant UI feedback
      const cacheKey = getDiscussionsCacheKey();
      if (cacheKey) {
        const previousReplies = queryClient.getQueryData<Entry[]>(cacheKey);
        queryClient.setQueryData<Entry[]>(cacheKey, (prev = []) =>
          prev.filter((r) => r.author !== entry.author || r.permlink !== entry.permlink)
        );
        return { previousReplies };
      }

      return {};
    },

    onSuccess: () => {
      // Mutation succeeded - call success callback
      onSuccess();
    },

    onError: (err, variables, context) => {
      // Blockchain failed - restore optimistic entry
      const { previousReplies } = context ?? {};
      const cacheKey = getDiscussionsCacheKey();

      if (cacheKey && previousReplies) {
        queryClient.setQueryData<Entry[]>(cacheKey, previousReplies);
      }

      const errorMessage = formatError(err);
      error(errorMessage[0], errorMessage[1] || i18next.t("comment.delete-error-hint"));
    },
  });
}
