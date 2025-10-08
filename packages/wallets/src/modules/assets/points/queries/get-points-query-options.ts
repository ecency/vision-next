import { CONFIG } from "@ecency/sdk";
import { queryOptions } from "@tanstack/react-query";
import { PointsResponse } from "../types";

export function getPointsQueryOptions(username?: string) {
  return queryOptions({
    queryKey: ["assets", "points", username],
    queryFn: async () => {
      if (!username) {
        throw new Error(
          "[SDK][Wallets][Assets][Points][Query] – username wasn`t provided"
        );
      }

      const response = await fetch(
        CONFIG.privateApiHost + "/private-api/points",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username }),
        }
      );
      const points = (await response.json()) satisfies PointsResponse;
      return {
        points: points.points,
        uPoints: points.unclaimed_points,
      } as const;
    },
    staleTime: 60000,
    refetchInterval: 90000,
    refetchOnMount: true,
    enabled: !!username,
  });
}
