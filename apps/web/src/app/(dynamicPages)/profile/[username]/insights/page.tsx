import { getAccountFullQuery } from "@/api/queries";
import { generateProfileMetadata } from "../_helpers";
import { Metadata, ResolvingMetadata } from "next";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { ProfileInsights } from "./_page";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), "insights");
}

export default async function InsightsPage({ params }: Props) {
  const { username } = await params;
  const { get } = await cookies();

  const account = await getAccountFullQuery(username.replace("%40", "")).prefetch();

  if (!account) {
    return notFound();
  }

  if (account.name !== get("active_user")?.value) {
    return redirect(`/@${username.replace("%40", "")}`);
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfileInsights username={account.name} />
    </HydrationBoundary>
  );
}

