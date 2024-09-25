import { getAccountFullQuery } from "@/api/queries";
import { notFound } from "next/navigation";
import { CurationTrail } from "../_components";
import { ProfileEntriesLayout } from "@/app/(dynamicPages)/profile/[username]/_components/profile-entries-layout";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: { username: string };
}

export default async function TrailPage({ params: { username } }: Props) {
  const account = await getAccountFullQuery(username).prefetch();

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfileEntriesLayout username={username} section="trail">
        <CurationTrail account={account} section="trail" />
      </ProfileEntriesLayout>
    </HydrationBoundary>
  );
}
