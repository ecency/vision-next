import { Metadata, ResolvingMetadata } from "next";
import { getContributorsQueryOptions } from "@/api/queries";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient, prefetchQuery } from "@/core/react-query";
import { PagesMetadataGenerator } from "@/features/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: unknown,
  parent: ResolvingMetadata
): Promise<Metadata> {
  return PagesMetadataGenerator.getForPage("discover");
}

export default async function Discover() {
  await prefetchQuery(getContributorsQueryOptions());

  return (
    <HydrationBoundary state={dehydrate(getQueryClient())}>
      <div></div>
    </HydrationBoundary>
  );
}
