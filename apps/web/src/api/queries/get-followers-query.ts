import { EcencyQueriesManager } from "@/core/react-query";
import { getFollowingQueryOptions } from "@ecency/sdk";

export const getFollowingQuery = (
  follower: string | undefined,
  startFollowing: string,
  followType = "blog",
  limit = 100
) =>
  EcencyQueriesManager.generateClientServerQuery(
    getFollowingQueryOptions(follower, startFollowing, followType, limit)
  );
