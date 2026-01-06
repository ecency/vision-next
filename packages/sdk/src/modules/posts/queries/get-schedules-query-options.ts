import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getAccessToken } from "@/modules/core";
import { Schedule } from "../types/schedule";

export function getSchedulesQueryOptions(activeUsername: string | undefined) {
  return queryOptions({
    queryKey: ["posts", "schedules", activeUsername],
    queryFn: async () => {
      if (!activeUsername) {
        return [];
      }

      const response = await fetch(CONFIG.privateApiHost + "/private-api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: getAccessToken(activeUsername),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }

      return response.json() as Promise<Schedule[]>;
    },
    enabled: !!activeUsername,
  });
}
