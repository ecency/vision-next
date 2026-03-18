import { queryOptions } from "@tanstack/react-query";
import { QueryKeys } from "../../core";

const BAD_ACTORS_URL =
  "https://raw.githubusercontent.com/openhive-network/watchmen/main/output/flat/badactors.txt";

export function getBadActorsQueryOptions() {
  return queryOptions({
    queryKey: QueryKeys.badActors.list(),
    queryFn: async ({ signal }) => {
      const response = await fetch(BAD_ACTORS_URL, { signal });

      if (!response.ok) {
        throw new Error(`Failed to fetch bad actors list: ${response.status}`);
      }

      const text = await response.text();
      return new Set(text.split("\n").filter(Boolean));
    },
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: Infinity
  });
}
