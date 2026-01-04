import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { LeaderBoardDuration, LeaderBoardItem } from "../types";

export function getDiscoverLeaderboardQueryOptions(duration: LeaderBoardDuration) {
  return queryOptions({
    queryKey: ["analytics", "discover-leaderboard", duration],
    queryFn: async ({ signal }) => {
      const response = await fetch(
        CONFIG.privateApiHost + `/private-api/leaderboard/${duration}`,
        { signal }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status}`);
      }

      return response.json() as Promise<LeaderBoardItem[]>;
    },
  });
}
