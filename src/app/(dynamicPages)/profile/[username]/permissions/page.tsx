import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { Metadata, ResolvingMetadata } from "next";
import { generateProfileMetadata } from "@/app/(dynamicPages)/profile/[username]/_helpers";
import { ProfilePermissions } from "./_components";

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
  const isAuthenticated = (await cookies()).has(ACTIVE_USER_COOKIE_NAME);

  if (!isAuthenticated) {
    return notFound();
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <ProfilePermissions />
    </HydrationBoundary>
  );
}
