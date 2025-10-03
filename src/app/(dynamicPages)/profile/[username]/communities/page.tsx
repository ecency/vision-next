import { notFound } from "next/navigation";
import { ProfileCommunities } from "./_page";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { getAccountFullQueryOptions } from "@ecency/sdk";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), "communities");
}

export default async function ProfileCommunitiesPage({ params }: Props) {
  const { username } = await params;

  const query = getAccountFullQueryOptions(username.replace("%40", ""));
  await getQueryClient().prefetchQuery(query);
  const account = getQueryClient().getQueryData(query.queryKey);

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfileCommunities />
    </HydrationBoundary>
  );
}
