import { notFound } from "next/navigation";
import { ProfilePermissions } from "@/app/(dynamicPages)/profile/[username]/_components/profile-permissions";
import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";

interface Props {
  params: { username: string };
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return generateProfileMetadata(props.params.username, "permissions");
}

export default async function PermissionsPage({ params: { username } }: Props) {
  const isAuthenticated = cookies().has(ACTIVE_USER_COOKIE_NAME);

  if (!isAuthenticated) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfilePermissions />
    </HydrationBoundary>
  );
}
