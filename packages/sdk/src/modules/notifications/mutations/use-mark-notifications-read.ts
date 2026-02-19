import { useMutation, QueryKey, InfiniteData } from "@tanstack/react-query";
import { getQueryClient, QueryKeys } from "@/modules/core";
import { markNotifications } from "@/modules/private-api/requests";
import { ApiNotification } from "../types";

type NotificationPage = ApiNotification[];
type InfiniteNotificationData = InfiniteData<NotificationPage>;

function markNotificationRead(item: ApiNotification, id?: string): ApiNotification {
  return {
    ...item,
    read: (!id || id === item.id ? 1 : item.read) as 0 | 1,
  };
}

function isInfiniteData(data: unknown): data is InfiniteNotificationData {
  return (
    typeof data === "object" &&
    data !== null &&
    "pages" in data &&
    "pageParams" in data &&
    Array.isArray((data as InfiniteNotificationData).pages)
  );
}

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
      await queryClient.cancelQueries({ queryKey: QueryKeys.notifications._prefix });

      // Snapshot current state for rollback
      const previousData: Array<[QueryKey, unknown]> = [];

      // Update infinite notification list queries (pages structure)
      const infiniteQueries = queryClient.getQueriesData<InfiniteNotificationData>({
        queryKey: QueryKeys.notifications._prefix,
        predicate: (query) => {
          const data = query.state.data;
          return isInfiniteData(data);
        },
      });

      infiniteQueries.forEach(([queryKey, data]) => {
        if (data && isInfiniteData(data)) {
          previousData.push([queryKey, data]);

          const updatedData: InfiniteNotificationData = {
            ...data,
            pages: data.pages.map((page) =>
              page.map((item) => markNotificationRead(item, id))
            ),
          };

          queryClient.setQueryData(queryKey, updatedData);
        }
      });

      // Optimistically decrement unread count
      const unreadKey = QueryKeys.notifications.unreadCount(username);
      const currentUnread = queryClient.getQueryData<number>(unreadKey);
      if (typeof currentUnread === "number" && currentUnread > 0) {
        previousData.push([unreadKey, currentUnread]);

        if (!id) {
          // Mark all: set to 0
          queryClient.setQueryData(unreadKey, 0);
        } else {
          // Mark single: only decrement if the notification is currently unread
          const isUnread = infiniteQueries.some(([, d]) =>
            d?.pages.some((page) =>
              page.some((item) => item.id === id && item.read === 0)
            )
          );
          if (isUnread) {
            queryClient.setQueryData(unreadKey, currentUnread - 1);
          }
        }
      }

      // Return context for rollback
      return { previousData };
    },

    onSuccess: (response) => {
      // Extract unread count from response if available
      const unreadCount = typeof response === "object" && response !== null
        ? (response as { unread?: number }).unread
        : undefined;

      // Update unread count cache with server value
      if (typeof unreadCount === "number") {
        queryClient.setQueryData(
          QueryKeys.notifications.unreadCount(username),
          unreadCount
        );
      }

      onSuccess?.(unreadCount);
    },

    // Rollback optimistic update on error
    onError: (error, _variables, context) => {
      // Restore previous state
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      onError?.(error as Error);
    },

    // Always refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QueryKeys.notifications._prefix,
      });
    },
  });
}
