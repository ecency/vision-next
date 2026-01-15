import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { ProfilePermissions } from "./_components";
import { getAccountFullQueryOptions } from "@ecency/sdk";

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return generateProfileMetadata(
    (await cookies()).get(ACTIVE_USER_COOKIE_NAME)?.value ?? "Current user",
    "permissions"
  );
}

export default async function PermissionsPage({ params }: Props) {
  const { username } = await params;
  const { get } = await cookies();
  const account = await prefetchQuery(getAccountFullQueryOptions(username.replace("%40", "")));

  if (!account) {
    return notFound();
  }

  if (account.name !== get("active_user")?.value) {
    return redirect(`/@${username.replace("%40", "")}`);
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfilePermissions />
    </HydrationBoundary>
  );
}
