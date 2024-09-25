import { getAccountFullQuery } from "@/api/queries";
import { notFound } from "next/navigation";
import { ProfileCommunities } from "@/app/[...slugs]/_profile-components";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: { username: string };
}

export default async function ProfileCommunitiesPage({ params: { username } }: Props) {
  const account = await getAccountFullQuery(username).prefetch();

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfileCommunities account={account} />
    </HydrationBoundary>
  );
}
