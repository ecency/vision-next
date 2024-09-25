import { getAccountFullQuery } from "@/api/queries";
import { notFound } from "next/navigation";
import { WalletSpk } from "@/app/[...slugs]/_profile-components";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: { username: string };
}

export default async function SpkPage({ params: { username } }: Props) {
  const account = await getAccountFullQuery(username).prefetch();

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <WalletSpk account={account} />
    </HydrationBoundary>
  );
}
