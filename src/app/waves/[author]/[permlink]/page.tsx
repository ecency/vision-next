import { EcencyEntriesCacheManagement } from "@/core/caches";
import { notFound } from "next/navigation";
import { WaveViewDetails, WaveViewDiscussion } from "@/app/waves/[author]/[permlink]/_components";
import { WaveEntry } from "@/entities";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: Promise<{
    author: string;
    permlink: string;
  }>;
}

export default async function WaveViewPage({ params }: Props) {
  const { author, permlink } = await params;

  const data = (await EcencyEntriesCacheManagement.getEntryQueryByPath(
    author,
    permlink
  ).prefetch()) as WaveEntry;

  if (!data) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <div className="flex flex-col gap-4 lg:gap-6 xl:gap-8">
        <WaveViewDetails entry={data} />
        <WaveViewDiscussion entry={data} />
      </div>
    </HydrationBoundary>
  );
}
