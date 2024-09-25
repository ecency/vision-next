import { CommunityRoles } from "../_components";
import { getCommunityCache } from "@/core/caches";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateCommunityMetadata } from "@/app/(dynamicPages)/community/[community]/_helpers";

interface Props {
  params: { community: string };
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return generateCommunityMetadata(props.params.community, "roles");
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
