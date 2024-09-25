import { CommunityActivities } from "../_components";
import { getCommunityCache } from "@/core/caches";
import { notFound } from "next/navigation";
import { getQueryClient } from "@/core/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

interface Props {
  params: { tag: string; community: string };
}

export default async function ActivitiesPage({ params: { community } }: Props) {
  const communityData = await getCommunityCache(community).prefetch();
  if (!communityData) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <CommunityActivities community={communityData} />
    </HydrationBoundary>
  );
}
