import { getAccountFullQuery } from "@/api/queries";
import { notFound } from "next/navigation";
import { WalletHiveEngine } from "../_components";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";

interface Props {
  params: { username: string };
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return generateProfileMetadata(props.params.username.replace("%40", ""), "engine");
}

export default async function EnginePage({ params: { username } }: Props) {
  const account = await getAccountFullQuery(username.replace("%40", "")).prefetch();

  if (!account) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <WalletHiveEngine account={account} />
    </HydrationBoundary>
  );
}
