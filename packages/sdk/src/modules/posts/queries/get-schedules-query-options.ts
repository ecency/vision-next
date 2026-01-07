import { queryOptions } from "@tanstack/react-query";
import { CONFIG, getBoundFetch } from "@/modules/core";
import { Schedule } from "../types/schedule";

export function getSchedulesQueryOptions(activeUsername: string | undefined, code?: string) {
  return queryOptions({
    queryKey: ["posts", "schedules", activeUsername],
    queryFn: async () => {
      if (!activeUsername || !code) {
        return [];
      }

      const fetchApi = getBoundFetch();
      const response = await fetchApi(CONFIG.privateApiHost + "/private-api/schedules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch schedules: ${response.status}`);
      }

      return response.json() as Promise<Schedule[]>;
    },
    enabled: !!activeUsername && !!code,
  });
}
