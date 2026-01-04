import { getDiscoverLeaderboardQueryOptions, LeaderBoardDuration, LeaderBoardItem } from "@ecency/sdk";
import { useQuery } from "@tanstack/react-query";

export type { LeaderBoardDuration, LeaderBoardItem };

export const getDiscoverLeaderboardQuery = (duration: LeaderBoardDuration) => {
  const options = getDiscoverLeaderboardQueryOptions(duration);

  return {
    ...options,
    useClientQuery: () => useQuery(options),
  };
};
