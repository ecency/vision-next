import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { Community } from "@/entities";
import { AccountNotification, bridgeApiCall } from "@/api/bridge";

// Page = AccountNotification[], Cursor = number|null (last_id)
type NotifPage = AccountNotification[];
type NotifCursor = number | null;

export function getAccountNotificationsQuery(community: Community, limit: number) {
  return EcencyQueriesManager.generateClientServerInfiniteQuery<NotifPage, NotifCursor>({
    queryKey: [QueryIdentifiers.ACCOUNT_NOTIFICATIONS, community.name, limit],

    // explicit initials keep InfiniteData<NotifPage, NotifCursor> consistent
    initialData: { pages: [], pageParams: [] },
    initialPageParam: null as NotifCursor,

    // type the destructured arg so there's no implicit-any
    queryFn: async ({ pageParam }: { pageParam: NotifCursor }) => {
      try {
        const response = await bridgeApiCall<AccountNotification[] | null>(
            "account_notifications",
            {
              account: community.name,
              limit,
              last_id: pageParam ?? undefined,
            }
        );
        return response ?? [];
      } catch {
        return [];
      }
    },

    // return the next cursor (last item's id) or null to stop
    getNextPageParam: (lastPage: NotifPage): NotifCursor =>
        lastPage?.length > 0 ? lastPage[lastPage.length - 1].id : null,
  });
}
