import { getAccountFullQuery, getTransactionsQuery } from "@/api/queries";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { getQueryClient } from "@/core/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { ProfileWalletTokenPicker, ProfileWalletTokensList } from "./_components";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), "wallet");
}

export default async function WalletPage({ params }: Props) {
  const { username } = await params;
  const account = await getAccountFullQuery(username.replace("%40", "")).prefetch();
  await getTransactionsQuery(username, 20).prefetch();

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfileWalletTokenPicker />
      <ProfileWalletTokensList />
    </HydrationBoundary>
  );
}
