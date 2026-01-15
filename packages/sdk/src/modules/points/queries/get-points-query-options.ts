import { queryOptions } from "@tanstack/react-query";
import { CONFIG } from "@/modules/core";
import { PointTransaction } from "../types/point-transaction";

interface PointsResponse {
  points: string;
  unclaimed_points: string;
}

export function getPointsQueryOptions(username?: string, filter = 0) {
  return queryOptions({
    queryKey: ["points", username, filter],
    queryFn: async () => {
      if (!username) {
        throw new Error("Get points query – username wasn't provided");
      }

      const name = username.replace("@", "");

      // Get points
      const pointsResponse = await fetch(CONFIG.privateApiHost + "/private-api/points", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: name }),
      });

      if (!pointsResponse.ok) {
        throw new Error(`Failed to fetch points: ${pointsResponse.status}`);
      }

      const points = (await pointsResponse.json()) as PointsResponse;

      // Get transactions
      const transactionsResponse = await fetch(
        CONFIG.privateApiHost + "/private-api/point-list",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: name, type: filter }),
        }
      );

      if (!transactionsResponse.ok) {
        throw new Error(`Failed to fetch point transactions: ${transactionsResponse.status}`);
      }

      const transactions = (await transactionsResponse.json()) as PointTransaction[];

      return {
        points: points.points,
        uPoints: points.unclaimed_points,
        transactions,
      } as const;
    },
    staleTime: 30000,
    refetchOnMount: true,
    enabled: !!username,
  });
}
