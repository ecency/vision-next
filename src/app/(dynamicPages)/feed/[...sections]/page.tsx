import { cookies } from "next/headers";
import { ACTIVE_USER_COOKIE_NAME } from "@/consts";
import { getPromotedEntriesQuery, prefetchGetPostsFeedQuery } from "@/api/queries";
import { FeedContent } from "../_components";
import React from "react";
import { Metadata, ResolvingMetadata } from "next";
import { generateFeedMetadata } from "@/app/(dynamicPages)/feed/[...sections]/_helpers";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/core/react-query";

interface Props {
  params: { sections: string[] };
  searchParams: Record<string, string>;
}

export async function generateMetadata(props: Props, parent: ResolvingMetadata): Promise<Metadata> {
  return generateFeedMetadata(props.params.sections[0], props.params.sections[1]);
}

export default async function FeedPage({
  params: {
    sections: [filter = "hot", tag = ""]
  },
  searchParams
}: Props) {
  const cookiesStore = cookies();

  const observer = cookiesStore.get(ACTIVE_USER_COOKIE_NAME)?.value;
  await prefetchGetPostsFeedQuery(filter, tag, 20, observer);
  await getPromotedEntriesQuery().prefetch();

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <FeedContent searchParams={searchParams} tag={tag} filter={filter} observer={observer} />
    </HydrationBoundary>
  );
}
