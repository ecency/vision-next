import { notFound } from "next/navigation";
import { CurationTrail } from "../_components";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { prefetchQuery } from "@/core/react-query";
import { getAccountFullQueryOptions } from "@ecency/sdk";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace(/%40/g, ""), "trail");
}

export default async function TrailPage({ params }: Props) {
  const { username } = await params;
  const account = await prefetchQuery(getAccountFullQueryOptions(username.replace(/%40/g, "")));

  if (!account) {
    return notFound();
  }

  return (
    <ProfileEntriesLayout username={username.replace(/%40/g, "")} section="trail">
      <CurationTrail account={account} section="trail" />
    </ProfileEntriesLayout>
  );
}
