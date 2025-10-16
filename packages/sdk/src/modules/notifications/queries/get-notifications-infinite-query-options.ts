import { infiniteQueryOptions } from "@tanstack/react-query";
import { NotificationFilter } from "../enums";
import { CONFIG, getAccessToken } from "@/modules/core";
import { ApiNotification } from "../types";

export function getNotificationsInfiniteQueryOptions(
  activeUsername: string | undefined,
  filter: NotificationFilter | undefined = undefined
) {
  return infiniteQueryOptions({
    queryKey: ["notifications", activeUsername, filter],
    queryFn: async ({ pageParam }) => {
      const data = {
        code: getAccessToken(activeUsername!),
        filter,
        since: pageParam,
        user: undefined,
      };

      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/notifications",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      return response.json() as Promise<ApiNotification[]>;
    },
    enabled: !!activeUsername,
    initialData: { pages: [], pageParams: [] },
    initialPageParam: "",
    getNextPageParam: (lastPage) => lastPage?.[lastPage.length - 1]?.id ?? "",
    refetchOnMount: true,
  });
}
