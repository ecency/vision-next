import { notFound } from "next/navigation";
import { ProfilePermissions } from "@/app/[...slugs]/_profile-components/profile-permissions";
import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: { username: string };
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
