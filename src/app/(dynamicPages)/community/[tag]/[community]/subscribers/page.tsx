import { CommunitySubscribers } from "../_components";
import { getCommunityCache } from "@/core/caches";
import { notFound } from "next/navigation";

interface Props {
  params: { tag: string; community: string };
}

export default async function SubscribersPage({ params: { community } }: Props) {
  const communityData = await getCommunityCache(community).prefetch();
  if (!communityData) {
    return notFound();
  }

  return <CommunitySubscribers community={communityData} />;
}
