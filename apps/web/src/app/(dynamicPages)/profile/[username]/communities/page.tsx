import { notFound } from "next/navigation";
import { ProfileCommunities } from "./_page";
import { prefetchQuery } from "@/core/react-query";
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
  const account = await prefetchQuery(query);

  if (!account) {
    return notFound();
  }

  return <ProfileCommunities />;
}
