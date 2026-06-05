import { queryOptions } from "@tanstack/react-query";
import { CONFIG, QueryKeys } from "@/modules/core";
import { Spotlight } from "../types/spotlight";

// `_accessToken` is accepted for call-site parity with mobile (which passes one) but is
// intentionally unused: the spotlights endpoint is anonymous and only filters by date window.
export function getSpotlightsQueryOptions(_accessToken?: string) {
  return queryOptions({
    queryKey: QueryKeys.notifications.spotlights(),
    queryFn: async () => {
      const response = await fetch(CONFIG.privateApiHost + "/private-api/spotlights", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch spotlights: ${response.status}`);
      }

      const data = (await response.json()) as Spotlight[];
      return data || [];
    },
    staleTime: 3_600_000,
  });
}
