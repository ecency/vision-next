import { EcencyQueriesManager, QueryIdentifiers } from "@/core/react-query";
import { getPointTransactions } from "@/api/private-api";
import { appAxios } from "@/api/axios";
import { apiBase } from "@/api/helper";

const DEFAULT = {
  points: "0.000",
  uPoints: "0.000",
  transactions: []
};

interface PointsResponse {
  points: string;
  unclaimed_points: string;
}

export const getPointsQuery = (username?: string, filter = 0) => {
  return EcencyQueriesManager.generateConfiguredClientServerQuery(
    ({ visionFeatures }) => visionFeatures.points.enabled,
    {
      queryKey: [QueryIdentifiers.POINTS, username, filter],
      queryFn: async () => {
        if (!username) {
          throw new Error("Get points query – username wasn`t provided");
        }

        const name = username.replace("@", "");

        const points = (
          await appAxios.post<PointsResponse>(apiBase(`/private-api/points`), { username: name })
        ).data;
        const transactions = await getPointTransactions(name, filter);
        return {
          points: points.points,
          uPoints: points.unclaimed_points,
          transactions
        } as const;
      },
      staleTime: 30000,
      refetchOnMount: true,
      enabled: !!username
    }
  );
};
