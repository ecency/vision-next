import { useMutation, QueryKey } from "@tanstack/react-query";
import { getQueryClient } from "@/modules/core";
import { markNotifications } from "@/modules/private-api/requests";
import { ApiNotification } from "../types";

/**
 * Hook to mark notifications as read with optimistic updates
 *
 * @param username - Current user's username
 * @param code - Access token for authentication
 * @param onSuccess - Optional callback on successful mutation, receives unread count
 * @param onError - Optional callback on error
 *
 * @returns Mutation hook that accepts { id?: string }
 *
 * @example
 * ```typescript
 * const markAsRead = useMarkNotificationsRead(username, code);
 *
 * // Mark specific notification
 * markAsRead.mutate({ id: "notification-id" });
 *
 * // Mark all notifications (omit id)
 * markAsRead.mutate({});
 * ```
 */
export function useMarkNotificationsRead(
  username: string | undefined,
  code: string | undefined,
  onSuccess?: (unreadCount?: number) => void,
  onError?: (e: Error) => void
) {
  const queryClient = getQueryClient();

  return useMutation({
    mutationKey: ["notifications", "mark-read", username],

    mutationFn: async ({ id }: { id?: string }) => {
      if (!username || !code) {
        throw new Error("[SDK][Notifications] – missing auth for markNotifications");
      }
      return markNotifications(code, id);
    },

    // Optimistic update: Immediately mark notifications as read in cache
    onMutate: async ({ id }: { id?: string }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ["notifications"] });

      // Snapshot current state for rollback
      const previousNotifications: Array<[QueryKey, ApiNotification[] | undefined]> = [];

      // Get all notification queries from cache
      const queriesData = queryClient.getQueriesData<ApiNotification[]>({
        queryKey: ["notifications"],
      });

      // Update each cached notification query
      queriesData.forEach(([queryKey, data]) => {
        if (data) {
          // Save previous state
          previousNotifications.push([queryKey, data]);

          // Optimistically update: mark as read
          const updatedData = data.map((item) => ({
            ...item,
            // If specific ID provided: mark only that notification
            // If no ID (mark all): mark ALL notifications
            read: (!id || id === item.id ? 1 : item.read) as 0 | 1,
          }));

          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      // Return context for rollback
      return { previousNotifications };
    },

    onSuccess: (response, variables) => {
      // Extract unread count from response if available
      const unreadCount = typeof response === "object" && response !== null
        ? (response as { unread?: number }).unread
        : undefined;

      onSuccess?.(unreadCount);

      // If marking all notifications, invalidate to ensure fresh data
      if (!variables.id) {
        queryClient.invalidateQueries({
          queryKey: ["notifications"],
        });
      }
    },

    // Rollback optimistic update on error
    onError: (error, _variables, context) => {
      // Restore previous state
      if (context?.previousNotifications) {
        context.previousNotifications.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      onError?.(error as Error);
    },

    // Always refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications"],
      });
    },
  });
}
