import { CONFIG } from "@/modules/core";
import { queryOptions } from "@tanstack/react-query";

export function getNotificationsUnreadCountQueryOptions(
  activeUsername: string | undefined,
  code: string | undefined
) {
  return queryOptions({
    queryKey: ["notifications", "unread", activeUsername],
    queryFn: async () => {
      if (!code) {
        return 0;
      }
      const response = await fetch(
        `${CONFIG.privateApiHost}/private-api/notifications/unread`,
        {
          method: "POST",
          body: JSON.stringify({ code }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = (await response.json()) as { count: number };
      return data.count;
    },
    enabled: !!activeUsername && !!code,
    initialData: 0,
    refetchInterval: 60000,
  });
}
