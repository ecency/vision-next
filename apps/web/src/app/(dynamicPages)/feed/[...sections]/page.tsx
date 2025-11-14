import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { getPromotedEntriesQuery, prefetchGetPostsFeedQuery } from "@/api/queries";
import { FeedContent } from "../_components";
import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import { redirect } from "next/navigation";
import { generateFeedMetadata } from "@/app/(dynamicPages)/feed/[...sections]/_helpers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

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
  const sParams = await searchParams;

  const cookiesStore = await cookies();

  const observer = cookiesStore.get(ACTIVE_USER_COOKIE_NAME)?.value;
  if (!rawTag && observer && ["trending", "hot", "created"].includes(filter)) {
    redirect(`/${filter}/my`);
  }
  const initialFeedData = await prefetchGetPostsFeedQuery(filter, tag, 20, observer);
  await getPromotedEntriesQuery().prefetch();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <FeedContent
        searchParams={sParams}
        tag={tag}
        filter={filter}
        observer={observer}
        initialData={initialFeedData}
      />
    </HydrationBoundary>
  );
}
