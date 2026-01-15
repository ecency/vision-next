import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { Announcement } from "../types/announcement";

export function getAnnouncementsQueryOptions() {
  return queryOptions({
    queryKey: ["notifications", "announcements"],
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/announcements", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch announcements: ${response.status}`);
      }

      const data = await response.json() as Announcement[];
      return data || [];
    },
    staleTime: 3_600_000,
  });
}
