import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { prefetchGetPostsFeedQuery } from "@/api/queries";
import { FeedLayout, FeedList } from "../_components";
import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { generateFeedMetadata } from "@/app/(dynamicPages)/feed/[...sections]/_helpers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";
import { getPromotedPostsQuery } from "@ecency/sdk";
import { EcencyConfigManager } from "@/config";

interface Props {
  params: Promise<{ sections: string[] }>;
  searchParams: Promise<Record<string, string>>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  const { sections } = await props.params;
  return generateFeedMetadata(sections[0], sections[1]);
}

export default async function FeedPage({ params, searchParams }: Props) {
  const [filter = "hot", rawTag = ""] = (await params).sections;
  const tag = rawTag === "global" ? "" : rawTag;

  const cookiesStore = await cookies();

  // observer is for filtering muted users/content - always use logged-in user or "ecency"
  const loggedInUser = cookiesStore.get(ACTIVE_USER_COOKIE_NAME)?.value;
  const observer = loggedInUser || "ecency";

  // Prefetch data on server for hydration
  await prefetchGetPostsFeedQuery(filter, tag, 20, observer);

  // Only prefetch promoted posts if promotions feature is enabled
  if (EcencyConfigManager.CONFIG.visionFeatures.promotions.enabled) {
    await getQueryClient().prefetchQuery(getPromotedPostsQuery());
  }

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <FeedLayout tag={tag} filter={filter} observer={observer}>
        <FeedList filter={filter} tag={tag} observer={observer} />
      </FeedLayout>
    </HydrationBoundary>
  );
}
