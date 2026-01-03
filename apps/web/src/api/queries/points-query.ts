import { EcencyQueriesManager } from "@/core/react-query";
import { getPointsQueryOptions } from "@ecency/sdk";

export const getPointsQuery = (username?: string, filter = 0) => {
  return EcencyQueriesManager.generateConfiguredClientServerQuery(
    ({ visionFeatures }) => visionFeatures.points.enabled,
    getPointsQueryOptions(username, filter)
  );
};
