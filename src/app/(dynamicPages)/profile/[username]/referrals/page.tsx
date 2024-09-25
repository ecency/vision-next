import { getAccountFullQuery } from "@/api/queries";
import { notFound } from "next/navigation";
import { WalletEcency } from "../_components";
import { Redirect } from "@/features/shared";
import { EcencyConfigManager } from "@/config";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: { username: string };
}

export default async function ReferralsPage({ params: { username } }: Props) {
  const account = await getAccountFullQuery(username).prefetch();

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <EcencyConfigManager.Conditional
        condition={({ visionFeatures }) => visionFeatures.points.enabled}
        fallback={<Redirect path="/" />}
      >
        <WalletEcency account={account} />
      </EcencyConfigManager.Conditional>
    </HydrationBoundary>
  );
}
