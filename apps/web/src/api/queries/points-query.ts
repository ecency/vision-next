import { withFeatureFlag } from "@/core/react-query";
import { getPointsQueryOptions } from "@ecency/sdk";

export const getPointsQuery = (username?: string, filter = 0) =>
  withFeatureFlag(
    ({ visionFeatures }) => visionFeatures.points.enabled,
    getPointsQueryOptions(username, filter)
  );
