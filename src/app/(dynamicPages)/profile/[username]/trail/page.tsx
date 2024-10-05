import { getAccountFullQuery } from "@/api/queries";
import { notFound } from "next/navigation";
import { CurationTrail } from "../_components";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";

interface Props {
  params: { username: string };
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return generateProfileMetadata(props.params.username.replace("%40", ""), "trail");
}

export default async function TrailPage({ params: { username } }: Props) {
  const account = await getAccountFullQuery(username.replace("%40", "")).prefetch();

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfileEntriesLayout username={username.replace("%40", "")} section="trail">
        <CurationTrail account={account} section="trail" />
      </ProfileEntriesLayout>
    </HydrationBoundary>
  );
}