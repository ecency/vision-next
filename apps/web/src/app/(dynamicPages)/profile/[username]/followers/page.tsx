import { notFound } from "next/navigation";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { ProfileFriends } from "@/app/(dynamicPages)/profile/[username]/_components/friends/profile-friends";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace(/%40/g, ""), "followers");
}

export default async function FollowersPage({ params }: Props) {
  const { username } = await params;
  const account = await prefetchQuery(getAccountFullQueryOptions(username.replace(/%40/g, "")));

  if (!account) {
    return notFound();
  }

  return <ProfileFriends account={account} mode="followers" />;
}
