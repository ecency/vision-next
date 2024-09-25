import { getAccountFullQuery } from "@/api/queries";
import { notFound } from "next/navigation";
import { ProfileReferrals } from "@/app/[...slugs]/_profile-components";
import { Redirect } from "@/features/shared";
import { EcencyConfigManager } from "@/config";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: { username: string };
}

export default async function PointsPage({ params: { username } }: Props) {
  const account = await getAccountFullQuery(username).prefetch();

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.referrals.enabled}
        fallback={<Redirect path="/" />}
      >
        <ProfileReferrals account={account} />
      </EcencyConfigManager.Conditional>
    </HydrationBoundary>
  );
}
