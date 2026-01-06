import { CONFIG, getAccessToken } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

export function getNotificationsUnreadCountQueryOptions(
  activeUsername: string | undefined
) {
  return queryOptions({
    queryKey: ["notifications", "unread", activeUsername],
    queryFn: async () => {
      const response = await fetch(
        `${CONFIG.privateApiHost}/private-api/notifications/unread`,
        {
          method: "POST",
          body: JSON.stringify({ code: getAccessToken(activeUsername!) }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = (await response.json()) as { count: number };
      return data.count;
    },
    enabled: !!activeUsername,
    initialData: 0,
    refetchInterval: 60000,
  });
}
