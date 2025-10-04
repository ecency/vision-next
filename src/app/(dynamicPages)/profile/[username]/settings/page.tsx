import { getAccountFullQuery } from "@/api/queries";
import { notFound, redirect } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { ProfileSettings } from "./_page";
import { cookies } from "next/headers";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { username } = await props.params;
  return generateProfileMetadata(username.replace("%40", ""), "settings");
}

export default async function SettingsPage({ params }: Props) {
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
      <ProfileSettings />
    </HydrationBoundary>
  );
}
