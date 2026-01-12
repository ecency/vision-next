import { CommunitySubscribers } from "../_components";
import { getCommunityCache } from "@/core/caches";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateCommunityMetadata } from "@/app/(dynamicPages)/community/[community]/_helpers";

interface Props {
  params: Promise<{ community: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { community } = await props.params;
  return generateCommunityMetadata(community, "subscribers");
}

export default async function SubscribersPage({ params }: Props) {
  const { community } = await params;
  const communityData = await prefetchQuery(getCommunityCache(community));
  if (!communityData) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <CommunitySubscribers community={communityData} />
    </HydrationBoundary>
  );
}
