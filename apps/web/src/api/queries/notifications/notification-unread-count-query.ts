import { useQuery } from "@tanstack/react-query";
import { QueryIdentifiers } from "@/core/react-query";
import { useActiveAccount } from "@/core/hooks/use-active-account";
import { getAccessToken } from "@/utils";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";

export function useNotificationUnreadCountQuery() {
  const { activeUser } = useActiveAccount();

  return useQuery({
    queryKey: [QueryIdentifiers.NOTIFICATIONS_UNREAD_COUNT, activeUser?.username],
    queryFn: () => {
      if (!activeUser?.username) {
        return;
      }

      const data = { code: getAccessToken(activeUser?.username) };

      return data.code
        ? appAxios
            .post(apiBase(`/private-api/notifications/unread`), data)
            .then((resp) => resp.data.count)
        : Promise.resolve(0);
    },
    enabled: !!activeUser,
    initialData: 0,
    refetchInterval: 60000
  });
}
