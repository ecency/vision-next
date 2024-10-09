import { DiscoverLeaderboard } from "@/app/discover/_components";
import { LeaderBoardDuration } from "@/entities";
import { EcencyConfigManager } from "@/config";
import { getDiscoverLeaderboardQuery } from "@/api/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  searchParams: Record<string, string | undefined>;
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const leaderboardData = await getDiscoverLeaderboardQuery(
    (searchParams["period"] as LeaderBoardDuration) ?? "day"
  ).prefetch();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.discover.leaderboard.enabled}
      >
        <div className="top-users">
          <DiscoverLeaderboard
            data={leaderboardData}
            period={searchParams["period"] as LeaderBoardDuration}
          />
        </div>
      </EcencyConfigManager.Conditional>
    </HydrationBoundary>
  );
}
