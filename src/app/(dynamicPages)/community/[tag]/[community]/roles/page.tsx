import { CommunityRoles } from "../_components";
import { getCommunityCache } from "@/core/caches";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: { tag: string; community: string };
}

export default async function RolesPage({ params: { community } }: Props) {
  const communityData = await getCommunityCache(community).prefetch();
  if (!communityData) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <CommunityRoles community={communityData} />
    </HydrationBoundary>
  );
}
