import { infiniteQueryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core/config";
import { QueryKeys } from "@/modules/core";
import { AccountNotification } from "../types";

type NotifPage = AccountNotification[];
type NotifCursor = number | null;

/**
 * Get account notifications for a community (bridge API)
 *
 * @param account - The account/community name
 * @param limit - Number of notifications per page
 */
export function getAccountNotificationsInfiniteQueryOptions(
  account: string,
  limit: number
) {
  return infiniteQueryOptions<NotifPage, Error, NotifPage, (string | number)[], NotifCursor>({
    queryKey: QueryKeys.communities.accountNotifications(account, limit),
    initialPageParam: null as NotifCursor,

    queryFn: async ({ pageParam }: { pageParam: NotifCursor }) => {
      try {
        const response = await CONFIG.hiveClient.call("bridge", "account_notifications", {
          account,
          limit,
          last_id: pageParam ?? undefined,
        });
        return (response as AccountNotification[] | null) ?? [];
      } catch {
        return [];
      }
    },

    getNextPageParam: (lastPage: NotifPage): NotifCursor =>
      lastPage?.length > 0 ? lastPage[lastPage.length - 1].id : null,
  });
}
