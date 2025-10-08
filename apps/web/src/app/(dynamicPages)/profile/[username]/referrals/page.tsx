import { getAccountFullQuery } from "@/api/queries";
import { notFound } from "next/navigation";
import { ProfileReferrals } from "../_components";
import { Redirect } from "@/features/shared";
import { EcencyConfigManager } from "@/config";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), "referrals");
}

export default async function ReferralsPage({ params }: Props) {
  const { username } = await params;
  const account = await getAccountFullQuery(username.replace("%40", "")).prefetch();

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
