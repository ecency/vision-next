import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound } from "next/navigation";
import { WaveViewDetails, WaveViewDiscussion } from "@/app/waves/[author]/[permlink]/_components";
import { WaveEntry } from "@/entities";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery } from "@/core/react-query";
import { EcencyConfigManager } from "@/config";
import { Metadata } from "next";
import { ScrollToTop } from "@/features/shared";

interface Props {
  params: Promise<{
    author: string;
    permlink: string;
  }>;
}

export const metadata: Metadata = {
  title: "Waves | Ecency",
  description: "Micro-blogging in decentralized system of Web 3.0"
};

export default async function WaveViewPage({ params }: Props) {
  const isWavesEnabled = EcencyConfigManager.selector(
    ({ visionFeatures }) => visionFeatures.waves.enabled
  );

  if (!isWavesEnabled) {
    return notFound();
  }

  const { author, permlink } = await params;

  const data = (await prefetchQuery(EcencyEntriesCacheManagement.getEntryQueryByPath(
    author.replace("%40", ""),
    permlink
  ))) as WaveEntry;

  if (!data) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <div className="flex flex-col gap-4 lg:gap-6 xl:gap-8">
        <ScrollToTop />
        <WaveViewDetails entry={data} />
        <WaveViewDiscussion entry={data} />
      </div>
    </HydrationBoundary>
  );
}
