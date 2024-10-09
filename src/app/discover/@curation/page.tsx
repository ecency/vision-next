import { DiscoverCuration } from "@/app/discover/_components";
import { CurationDuration, LeaderBoardDuration } from "@/entities";
import { EcencyConfigManager } from "@/config";
import { getDiscoverCurationQuery, getDynamicPropsQuery } from "@/api/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  searchParams: Record<string, string | undefined>;
}

export default async function CurationPage({ searchParams }: Props) {
  const dynamicProps = await getDynamicPropsQuery().prefetch();
  const curationData = await getDiscoverCurationQuery(
    (searchParams["period"] as LeaderBoardDuration) ?? "day"
  ).prefetch();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.discover.curation.enabled}
      >
        <div className="curation-users">
          <DiscoverCuration
            dynamicProps={dynamicProps}
            data={curationData}
            period={searchParams["period"] as CurationDuration}
          />
        </div>
      </EcencyConfigManager.Conditional>
    </HydrationBoundary>
  );
}
